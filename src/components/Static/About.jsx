import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBalanceScale,
  FaBolt,
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

const stats = [
  { value: "4+", label: "device categories covered" },
  { value: "Neutral", label: "comparison-first approach" },
  { value: "Fast", label: "clear decisions with less noise" },
];

const principles = [
  {
    icon: FaSearch,
    title: "Structured discovery",
    text: "We organize products so users can find the right category, brand, or feature faster.",
  },
  {
    icon: FaBalanceScale,
    title: "Comparison first",
    text: "We highlight specifications, variants, and price differences so trade-offs are easy to understand.",
  },
  {
    icon: FaShieldAlt,
    title: "Neutral by design",
    text: "Hooks is not a retailer. We focus on useful information, not sales pressure.",
  },
];

const coverage = [
  {
    icon: FaMobileAlt,
    title: "Smartphones",
    text: "Feature filters, launch tracking, pricing variants, and product detail pages.",
  },
  {
    icon: FaLaptop,
    title: "Laptops",
    text: "Performance, display, storage, portability, and model-by-model research.",
  },
  {
    icon: FaTv,
    title: "TVs",
    text: "Panel tech, resolution, smart features, and TV buying comparisons.",
  },
  {
    icon: FaWifi,
    title: "Networking",
    text: "Routers and connectivity gear for users who care about speed and range.",
  },
];

const About = () => {
  useTitle({ page: "About" });

  const canonical = "https://tryhook.shop/about";
  const aboutSchema = createAboutPageSchema({
    name: "About Hooks",
    description:
      "Hooks is an independent technology discovery and comparison platform built to help users make confident purchase decisions.",
    url: canonical,
    organizationName: "Hooks",
  });

  return (
    <>
      <SEO
        title="About Hooks - Independent Technology Comparison Platform"
        description="Learn how Hooks helps people compare smartphones, laptops, TVs, and networking products with cleaner, structured, and neutral information."
        image={`${canonical}/og-image`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={aboutSchema}
      />

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-24">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                <FaShieldAlt className="h-3.5 w-3.5" />
                About Hooks
              </span>

              <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                A clearer way to compare technology.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                Hooks helps people compare smartphones, laptops, TVs, and
                networking products with cleaner information, sharper context,
                and less noise.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/smartphones"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Browse Smartphones
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/compare"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/15"
                >
                  Compare Devices
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <p className="text-2xl font-black text-white sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                How Hooks works
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Built for clarity, not clutter.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The page layout, product discovery flow, and category structure
                are designed to reduce friction and help users get to the right
                choice faster.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {principles.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">
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

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                What we cover
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                The categories people research most.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Hooks focuses on the device categories where comparison matters
                most and where product details are often hard to read quickly.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {coverage.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-6 transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-slate-900">
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

      </main>
    </>
  );
};

export default About;
