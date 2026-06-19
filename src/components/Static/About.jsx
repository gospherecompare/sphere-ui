import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBalanceScale,
  FaBookOpen,
  FaBriefcase,
  FaChartLine,
  FaCheckCircle,
  FaChevronRight,
  FaClipboardList,
  FaLaptop,
  FaMobileAlt,
  FaNewspaper,
  FaSearch,
  FaShieldAlt,
  FaTv,
  FaWifi,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createAboutPageSchema } from "../../utils/schemaGenerators";
import { hookContactChannels } from "../../utils/hookContactChannels";
import { resolveSmartphoneBadgeScore } from "../../utils/smartphoneBadgeScore";

const SITE_ORIGIN = "https://tryhook.shop";
const API_ASSET_ORIGIN = "https://api.apisphere.in";
const ABOUT_SMARTPHONE_ENDPOINTS = [
  "https://api.apisphere.in/api/public/trending/smartphones?limit=12",
  "https://api.apisphere.in/api/public/new/smartphones?limit=12",
  "https://api.apisphere.in/api/smartphones",
];

const heroHighlights = [
  {
    value: "4+",
    label: "device categories covered",
    icon: FaMobileAlt,
  },
  {
    value: "Smartphones",
    label: "our primary focus",
    icon: FaMobileAlt,
  },
  {
    value: "Variant-aware",
    label: "pricing and comparisons",
    icon: FaClipboardList,
  },
  {
    value: "Transparent",
    label: "editorial guidance",
    icon: FaShieldAlt,
  },
];

const principles = [
  {
    icon: FaSearch,
    title: "Structured discovery",
    text: "We keep product pages organized so people can move from category to model to variant without friction.",
  },
  {
    icon: FaBalanceScale,
    title: "Comparison first",
    text: "Specs, pricing, and variant differences are shown side by side so trade-offs are easier to understand.",
  },
  {
    icon: FaShieldAlt,
    title: "Neutral by design",
    text: "Hooks is independent. We focus on useful information, not sponsored pressure or hidden priorities.",
  },
  {
    icon: FaChartLine,
    title: "Fresh and practical",
    text: "We aim to keep the data readable, current, and useful for people who want to act quickly.",
  },
];

const coverage = [
  {
    icon: FaMobileAlt,
    title: "Smartphones",
    text: "Launches, prices, variant options, feature filters, and side-by-side comparison flow.",
  },
  {
    icon: FaLaptop,
    title: "Laptops",
    text: "Performance, display, storage, portability, and model-by-model research.",
  },
  {
    icon: FaTv,
    title: "TVs",
    text: "Panel tech, resolution, smart features, and size-based buying guidance.",
  },
  {
    icon: FaWifi,
    title: "Networking",
    text: "Routers and connectivity gear for homes and users who care about range and speed.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Collect",
    text: "Gather structured specs, pricing, variants, and launch details from reliable sources.",
  },
  {
    step: "02",
    title: "Normalize",
    text: "Turn messy product data into consistent fields that are easier to compare and read.",
  },
  {
    step: "03",
    title: "Compare",
    text: "Present differences in a way that makes the best choice easier to spot at a glance.",
  },
];

const team = [
  {
    initials: "PR",
    title: "Product research",
    text: "Guides category structure and the discovery flow.",
  },
  {
    initials: "DQ",
    title: "Data quality",
    text: "Keeps specs, variants, and prices organized.",
  },
  {
    initials: "ED",
    title: "Editorial",
    text: "Turns raw specs into readable buying context.",
  },
  {
    initials: "UX",
    title: "UX design",
    text: "Shapes the compare journey across devices.",
  },
  {
    initials: "EN",
    title: "Engineering",
    text: "Builds the product pages and comparison engine.",
  },
];

const aboutMailChannels = hookContactChannels.filter((channel) =>
  ["business", "news"].includes(channel.key),
);

const aboutMailIcons = {
  business: FaBriefcase,
  news: FaNewspaper,
};

const aboutMailNotes = {
  business: "Partnerships, sponsorships, and commercial conversations.",
  news: "Launch updates, press notes, and editorial leads.",
};

const trustPoints = [
  "We do not sell products or placements.",
  "We do not push one brand over another.",
  "We show both strengths and trade-offs clearly.",
  "We keep the experience simple enough to act on quickly.",
];

const heroToolbar = {
  title: "Compare board",
  subtitle: "Smartphone shortlist",
  status: "Variant ready",
};
const heroToolbarDots = ["bg-blue-500", "bg-cyan-300", "bg-slate-300"];
const fallbackHeroProducts = [
  {
    brand: "OnePlus",
    model: "OnePlus 13",
    accentClass: "bg-blue-600",
    score: "92",
    specs: [
      { label: "Display", value: "120 Hz" },
      { label: "Camera", value: "50 MP" },
      { label: "Battery", value: "6000 mAh" },
    ],
    image: "",
  },
  {
    brand: "OPPO",
    model: "Find X9 Ultra",
    accentClass: "bg-slate-900",
    score: "90",
    specs: [
      { label: "Display", value: "144 Hz" },
      { label: "Camera", value: "50 MP" },
      { label: "Storage", value: "256 GB" },
    ],
    image: "",
  },
  {
    brand: "Samsung",
    model: "Galaxy S25 Ultra",
    accentClass: "bg-cyan-500",
    score: "94",
    specs: [
      { label: "Camera", value: "200 MP" },
      { label: "Battery", value: "5000 mAh" },
      { label: "Display", value: "120 Hz" },
    ],
    image: "",
  },
];
const heroAccentClasses = ["bg-blue-600", "bg-slate-900", "bg-cyan-500"];
const heroFloatingActions = [
  {
    key: "insights",
    icon: FaChartLine,
    className:
      "right-0 top-24 h-14 w-14 rounded-2xl bg-blue-600 text-white sm:-right-4",
  },
  {
    key: "search",
    icon: FaSearch,
    className:
      "bottom-8 left-0 h-14 w-14 rounded-full border border-slate-200 bg-white text-blue-600 sm:-left-3 sm:h-16 sm:w-16",
  },
];

const cleanText = (value) => String(value || "").trim();

const normalizeAssetUrl = (value) => {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${API_ASSET_ORIGIN}${raw}`;
  if (/^(uploads|assets|images)\//i.test(raw)) {
    return `${API_ASSET_ORIGIN}/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
};

const getFirstProductImage = (device) => {
  const imagePool = [
    device?.image,
    device?.image_url,
    device?.imageUrl,
    device?.product_image,
    device?.productImage,
    device?.primary_image,
    device?.primaryImage,
    device?.thumbnail,
    device?.picture,
    ...(Array.isArray(device?.images) ? device.images : []),
    ...(Array.isArray(device?.pictures) ? device.pictures : []),
    ...(Array.isArray(device?.photos) ? device.photos : []),
  ];

  return normalizeAssetUrl(imagePool.find((entry) => cleanText(entry)));
};

const formatHeroSpecValue = (value) => {
  if (value == null) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return "";
  if (typeof value === "string") {
    const text = value
      .split("|")[0]
      .replace(/\s+/g, " ")
      .trim();
    if (/^(yes|no|true|false|supported|not supported|n\/a|na)$/i.test(text)) {
      return "";
    }
    return text;
  }
  if (Array.isArray(value)) {
    return formatHeroSpecValue(value.find(Boolean));
  }
  if (typeof value === "object") {
    return formatHeroSpecValue(Object.values(value).find(Boolean));
  }
  return "";
};

const pickHeroSpecValue = (...values) => {
  for (const value of values) {
    const text = formatHeroSpecValue(value);
    if (text) return text.length > 16 ? `${text.slice(0, 15).trim()}...` : text;
  }
  return "";
};

const addHeroUnit = (value, unit) => {
  if (!value) return "";
  if (/[a-z]/i.test(value)) return value;
  return `${value} ${unit}`;
};

const getHeroSpecHighlights = (device) => {
  const display = device?.display || device?.specs?.display || {};
  const camera = device?.camera || device?.specs?.camera || {};
  const battery = device?.battery || device?.specs?.battery || {};
  const performance = device?.performance || device?.specs || {};

  const highlights = [
    {
      label: "Display",
      value: addHeroUnit(
        pickHeroSpecValue(
          display?.refresh_rate,
          display?.refreshRate,
          display?.size,
          display?.display_size,
          display?.type,
          device?.display,
        ),
        "Hz",
      ),
    },
    {
      label: "Camera",
      value: addHeroUnit(
        pickHeroSpecValue(
          camera?.main_camera_megapixels,
          camera?.main_camera,
          camera?.primary,
          camera?.rear_camera,
          device?.main_camera,
        ),
        "MP",
      ),
    },
    {
      label: "Battery",
      value: addHeroUnit(
        pickHeroSpecValue(
          battery?.capacity,
          battery?.battery,
          device?.battery_capacity,
          device?.battery,
        ),
        "mAh",
      ),
    },
    {
      label: "Chip",
      value: pickHeroSpecValue(
        performance?.processor,
        performance?.chipset,
        device?.processor,
        device?.chipset,
      ),
    },
    {
      label: "Memory",
      value: pickHeroSpecValue(performance?.ram, device?.ram, performance?.storage),
    },
  ].filter((item) => item.value);

  const seenValues = new Set();
  return highlights
    .filter((item) => {
      const key = `${item.label}:${item.value}`.toLowerCase();
      if (seenValues.has(key)) return false;
      seenValues.add(key);
      return true;
    })
    .slice(0, 3);
};

const extractHeroProductRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.smartphones)) return payload.smartphones;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const normalizeHeroProduct = (device, index) => {
  const source = device?.product || device?.smartphone || device?.device || {};
  const product = { ...source, ...device };
  const score = resolveSmartphoneBadgeScore(product);
  const roundedScore = Number.isFinite(Number(score))
    ? String(Math.round(Number(score)))
    : "";
  const brand = cleanText(product?.brand_name || product?.brand || "");
  const model = cleanText(
    product?.model || product?.name || product?.title || "",
  );

  return {
    brand: brand || "Smartphone",
    model: model || "Featured device",
    accentClass: heroAccentClasses[index % heroAccentClasses.length],
    score: roundedScore,
    specs: getHeroSpecHighlights(product),
    image: getFirstProductImage(product),
  };
};

const buildHeroProducts = (devices) => {
  const normalized = (Array.isArray(devices) ? devices : [])
    .map(normalizeHeroProduct)
    .filter((item) => item.model && item.score && item.image);

  return normalized.length >= 3 ? normalized.slice(0, 3) : fallbackHeroProducts;
};

const HeroMockup = ({ products = fallbackHeroProducts }) => (
  <div className="relative mx-auto w-full max-w-2xl overflow-visible">
    <div className="absolute -left-8 top-20 hidden h-24 w-24 rounded-full bg-blue-100/60 blur-3xl sm:block" />
    <div className="absolute -right-8 top-6 hidden h-20 w-20 rounded-full bg-slate-200/70 blur-3xl sm:block" />

    <div className="relative rounded-[32px] bg-white">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {heroToolbar.title}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {heroToolbar.subtitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full border border-blue-100 bg-white px-3 py-1 text-[11px] font-semibold text-blue-700 sm:inline-flex">
              {heroToolbar.status}
            </span>
            <span className="flex items-center gap-2">
              {heroToolbarDots.map((dotClass, index) => (
                <span
                  key={`${dotClass}-${index}`}
                  className={`h-2.5 w-2.5 rounded-full ${dotClass}`}
                />
              ))}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {products.map((item) => (
            <div
              key={item.model}
              className="flex min-h-[8.5rem] flex-col rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {item.brand}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-5 text-slate-900">
                    {item.model}
                  </p>
                </div>

                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 ${item.image ? "" : item.accentClass}`}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={`${item.model} product`}
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                  ) : null}
                </span>
              </div>

              <div className="mt-auto pt-5">
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Spec score
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
                    {item.score || "--"}
                  </span>
                </div>
                <dl className="mt-3 space-y-2">
                  {(item.specs.length
                    ? item.specs
                    : [
                        { label: "Specs", value: "Reviewed" },
                        { label: "Price", value: "Tracked" },
                      ]
                  ).map((spec) => (
                    <div
                      key={`${item.model}-${spec.label}-${spec.value}`}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <dt className="font-semibold text-slate-400">
                        {spec.label}
                      </dt>
                      <dd className="max-w-[6.5rem] truncate text-right font-semibold text-slate-700">
                        {spec.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {workflow.map((item) => (
            <div
              key={item.step}
              className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-xs font-bold text-blue-700">
                {item.step}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {heroFloatingActions.map((action) => {
      const Icon = action.icon;

      return (
        <div
          key={action.key}
          className={`absolute hidden items-center justify-center sm:flex ${action.className}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      );
    })}
  </div>
);

const StoryVisual = () => (
  <div className="rounded-[30px] border border-slate-200 bg-white p-4 lg:p-5">
    <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="h-2.5 w-24 rounded-full bg-slate-200" />
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {workflow.map((item) => (
          <div
            key={`story-${item.step}`}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-xs font-bold text-blue-700">
              {item.step}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "Clear specs",
            "Variant-aware",
            "Editorial context",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl bg-slate-50 px-4 py-3 text-center text-sm font-semibold text-slate-700"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const About = () => {
  useTitle({ page: "About" });

  const [heroDevices, setHeroDevices] = useState([]);
  const heroProducts = useMemo(
    () => buildHeroProducts(heroDevices),
    [heroDevices],
  );
  const canonical = `${SITE_ORIGIN}/about`;
  const aboutSchema = createAboutPageSchema({
    name: "About Hooks",
    description:
      "Hooks helps people compare smartphones, laptops, TVs, and networking products with transparent data and a cleaner discovery flow.",
    url: canonical,
    organizationName: "Hooks",
  });

  useEffect(() => {
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    const fetchHeroDevices = async () => {
      for (const endpoint of ABOUT_SMARTPHONE_ENDPOINTS) {
        try {
          const response = await fetch(
            endpoint,
            controller ? { signal: controller.signal } : undefined,
          );
          if (!response.ok) continue;

          const payload = await response.json();
          const rows = extractHeroProductRows(payload);
          if (!rows.length) continue;

          if (!cancelled) {
            setHeroDevices(rows);
          }
          break;
        } catch (error) {
          if (error?.name === "AbortError") return;
        }
      }
    };

    fetchHeroDevices();

    return () => {
      cancelled = true;
      controller?.abort?.();
    };
  }, []);

  return (
    <>
      <SEO
        title="About Hooks - Independent Tech Comparison Platform"
        description="Learn how Hooks helps people compare smartphones, laptops, TVs, and networking products with structured, neutral, and variant-aware information."
        image={`${SITE_ORIGIN}/hook-logo.svg`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={aboutSchema}
      />

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link
                to="/"
                className="text-slate-500 transition-colors hover:text-slate-900"
              >
                Home
              </Link>
              <FaChevronRight className="h-3 w-3 text-slate-300" />
              <span className="font-medium text-slate-700">About Us</span>
            </nav>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                  <FaBookOpen className="h-3.5 w-3.5" />
                  About Us
                </span>

                <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[4rem]">
                  Making tech choices simpler and smarter.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                  Hooks helps people compare smartphones first, while also
                  covering laptops, TVs, and networking products. We keep the
                  experience clean, variant-aware, and easy to understand so
                  the right choice feels less complicated.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/compare"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  Compare Devices
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/smartphones"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:bg-blue-50"
                >
                  Browse Smartphones
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                </div>
              </div>

              <HeroMockup products={heroProducts} />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Our mission
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                To help every buyer compare with confidence.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                We keep product discovery transparent, structured, and
                practical so users can move from confusion to a clear decision
                faster.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {principles.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  What we cover
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  The categories people research most.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Hooks focuses on the device categories where comparison
                  matters most and where product details are often hard to scan
                  quickly.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/compare"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  Compare Devices
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:bg-blue-50"
                >
                  Contact Hooks
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {coverage.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900">
                        <Icon className="h-5 w-5 text-blue-700" />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {item.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Our story
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Built to turn noisy specs into clearer decisions.
                </h2>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  Hooks started with a simple idea: buyers should not have to
                  jump between tabs, marketing pages, and scattered spec sheets
                  to understand a product. We make that process more structured
                  by keeping smartphones first and supporting laptops, TVs, and
                  networking devices as well.
                </p>
                <p className="mt-4 text-base leading-7 text-slate-600">
                  The goal is not to push one answer. The goal is to help users
                  see the trade-offs clearly enough to choose with confidence.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/careers"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                >
                  Join the team
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/news"
                  className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:bg-blue-50"
                >
                  Explore updates
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                </div>
              </div>

              <StoryVisual />
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                The people behind Hooks
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                A small team with a clear focus.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                We build around research, data quality, editorial clarity, and
                product experience. That keeps Hooks practical instead of
                noisy.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {team.map((member) => (
                <div
                  key={member.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold tracking-[0.22em] text-blue-700">
                    {member.initials}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {member.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {member.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-[28px] border border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Business and news
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Reach Hooks for partnerships and editorial updates.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    These inboxes are for business conversations, launch
                    material, press notes, and editorial leads.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {aboutMailChannels.map((channel) => {
                    const Icon = aboutMailIcons[channel.key] || FaBookOpen;

                    return (
                      <a
                        key={channel.key}
                        href={`mailto:${channel.email}`}
                        className="group flex min-h-[112px] items-start gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50/40"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-slate-900">
                            {channel.name}
                          </span>
                          <span className="mt-1 block break-all text-sm font-semibold text-blue-700">
                            {channel.email}
                          </span>
                          <span className="mt-2 block text-xs leading-5 text-slate-500">
                            {aboutMailNotes[channel.key]}
                          </span>
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 lg:p-8">
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Why you can trust us
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                    We keep the product story clear, neutral, and useful.
                  </h2>

                  <ul className="mt-6 space-y-4">
                    {trustPoints.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <FaCheckCircle className="h-4 w-4" />
                        </span>
                        <span className="text-sm leading-6 text-slate-600">
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-md rounded-[30px] border border-slate-200 bg-slate-50 p-8">
                    <div className="absolute left-6 top-6 h-3 w-3 rounded-full bg-blue-200/70" />
                    <div className="absolute right-8 top-10 h-2.5 w-2.5 rounded-full bg-slate-300/80" />
                    <div className="absolute bottom-8 left-12 h-2 w-2 rounded-full bg-blue-200/60" />

                    <div className="flex min-h-[18rem] items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-white p-6">
                      <div className="text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                          <FaShieldAlt className="h-11 w-11" />
                        </div>
                        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-blue-700">
                          Trust and transparency
                        </p>
                        <p className="mt-3 max-w-xs text-sm leading-7 text-slate-600">
                          Hooks is built to make compare data easier to read so
                          users can make practical decisions without extra noise.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default About;
