import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBalanceScale,
  FaBookOpen,
  FaChartLine,
  FaCheckCircle,
  FaChevronRight,
  FaClipboardList,
  FaLaptop,
  FaMobileAlt,
  FaSearch,
  FaShieldAlt,
  FaTv,
  FaWifi,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createAboutPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://tryhook.shop";

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

const trustPoints = [
  "We do not sell products or placements.",
  "We do not push one brand over another.",
  "We show both strengths and trade-offs clearly.",
  "We keep the experience simple enough to act on quickly.",
];

const HeroMockup = () => (
  <div className="relative mx-auto w-full max-w-2xl">
    <div className="absolute -left-8 top-20 hidden h-24 w-24 rounded-full bg-blue-100/60 blur-3xl sm:block" />
    <div className="absolute -right-8 top-6 hidden h-20 w-20 rounded-full bg-slate-200/70 blur-3xl sm:block" />

    <div className="relative rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.55)] sm:p-5">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="space-y-2">
            <div className="h-2.5 w-20 rounded-full bg-slate-200" />
            <div className="h-2.5 w-32 rounded-full bg-slate-100" />
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            {
              brand: "OnePlus",
              model: "OnePlus 13",
              accent: "bg-blue-600",
            },
            {
              brand: "OPPO",
              model: "Find X9 Ultra",
              accent: "bg-slate-900",
            },
            {
              brand: "Samsung",
              model: "Galaxy S25 Ultra",
              accent: "bg-cyan-500",
            },
          ].map((item) => (
            <div
              key={item.model}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                    {item.brand}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {item.model}
                  </p>
                </div>

                <span
                  className={`h-9 w-9 rounded-2xl ${item.accent} opacity-90 shadow-sm`}
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="h-2.5 rounded-full bg-slate-100" />
                <div className="grid grid-cols-3 gap-2">
                  <span className="h-2.5 rounded-full bg-slate-100" />
                  <span className="h-2.5 rounded-full bg-slate-100" />
                  <span className="h-2.5 rounded-full bg-slate-100" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {workflow.map((item) => (
            <div
              key={item.step}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-xs font-bold text-blue-700">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-slate-600">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="absolute -right-4 top-24 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
      <FaChartLine className="h-5 w-5" />
    </div>

    <div className="absolute -left-3 bottom-10 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-sm">
      <FaSearch className="h-7 w-7" />
    </div>
  </div>
);

const StoryVisual = () => (
  <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_35px_100px_-60px_rgba(15,23,42,0.45)] lg:p-5">
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

  const canonical = `${SITE_ORIGIN}/about`;
  const aboutSchema = createAboutPageSchema({
    name: "About Hooks",
    description:
      "Hooks helps people compare smartphones, laptops, TVs, and networking products with transparent data and a cleaner discovery flow.",
    url: canonical,
    organizationName: "Hooks",
  });

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
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.18)] transition-colors duration-200 hover:bg-blue-700"
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

              <HeroMockup />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroHighlights.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
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
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.16)] transition-colors duration-200 hover:bg-blue-700"
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
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
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
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.18)] transition-colors duration-200 hover:bg-blue-700"
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
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold tracking-[0.22em] text-blue-700 shadow-sm">
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
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
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
                  <div className="relative w-full max-w-md rounded-[30px] border border-slate-200 bg-slate-50 p-8 shadow-sm">
                    <div className="absolute left-6 top-6 h-3 w-3 rounded-full bg-blue-200/70" />
                    <div className="absolute right-8 top-10 h-2.5 w-2.5 rounded-full bg-slate-300/80" />
                    <div className="absolute bottom-8 left-12 h-2 w-2 rounded-full bg-blue-200/60" />

                    <div className="flex min-h-[18rem] items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-white p-6">
                      <div className="text-center">
                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 text-blue-700 shadow-sm">
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

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="rounded-[32px] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)] sm:px-8 sm:py-10">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                    Next step
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                    Ready to compare your next device?
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                    Explore smartphones, laptops, TVs, and networking products
                    with a cleaner comparison flow and transparent information.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/compare"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(37,99,235,0.18)] transition-colors duration-200 hover:bg-blue-700"
                  >
                    Compare Devices
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/smartphones"
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500/20"
                  >
                    Browse Smartphones
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
