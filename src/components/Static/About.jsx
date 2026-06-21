import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaAtom,
  FaEnvelope,
  FaEye,
  FaLaptop,
  FaMobileAlt,
  FaNewspaper,
  FaRobot,
  FaTv,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createAboutPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://tryhook.shop";
const CONTACT_EMAIL = "contact@tryhook.shop";

const storyParagraphs = [
  "Technology should make life simpler. Finding the right technology should not be the hard part.",
  "Every day, millions of people search for smartphones, televisions, laptops, wearables, and countless other devices that quietly shape how they live, work, and connect with the people around them. Yet too often, the search itself becomes the real challenge: specifications scattered across a dozen tabs, reviews that contradict each other, and marketing language designed to persuade rather than inform. By the time a decision gets made, it is easy to wonder whether it was really the right one.",
  "TryHook exists to close that gap.",
  "We built this platform on a simple belief: people deserve clarity, not confusion, when choosing the technology that fits their lives. Whether you are researching your next smartphone, comparing televisions for your living room, exploring how artificial intelligence is reshaping everyday products, or simply trying to keep pace with what is new, TryHook is designed to meet you exactly where you are, with information that is organized, comparisons that are meaningful, and coverage you can rely on.",
  "Technology is no longer reserved for enthusiasts and professionals. It is woven into the rhythm of everyday life: how we work, learn, create, entertain ourselves, and stay close to the people who matter most. The devices we choose carry real weight in that experience. A laptop is not just a processor and a screen size; it is the tool you may rely on for years of work and creativity. A television is not just a panel type and a refresh rate; it is the centerpiece of countless evenings at home.",
  "That is why we go beyond simply listing numbers on a spec sheet. We help you understand what those numbers actually mean for your budget, your habits, and your day-to-day expectations, so that every decision feels considered, not guessed at. Our goal is to give you the confidence that comes from genuinely understanding your options, not just skimming through them.",
  "Our coverage extends past individual devices to the broader forces shaping what comes next. We follow developments in artificial intelligence, software, internet services, scientific research, space exploration, and the wider currents of digital transformation. We believe that understanding where technology is headed is just as valuable as choosing what to buy today. For readers who want to stay ahead of the curve rather than simply keep up with it, TryHook aims to be a steady, trustworthy source of insight.",
  "The technology landscape will keep shifting. New categories will emerge, old ones will fade, and the pace of change will only accelerate. Through all of it, our purpose stays fixed: to be a place where discovery, knowledge, and trust come together in one experience. We want every visit to TryHook to leave you a little more informed, a little more confident, and a little closer to the decision that is right for you.",
  "Thank you for being part of the TryHook journey. As we continue to grow, our promise remains unchanged: to help you discover better technology, make smarter decisions, and stay connected to the future as it takes shape.",
];

const storySections = [
  {
    eyebrow: "Why TryHook exists",
    title: "Technology should make life simpler.",
    paragraphs: storyParagraphs.slice(0, 4),
    accentBorder: "border-l-blue-600",
    accentText: "text-blue-700",
  },
  {
    eyebrow: "How we help",
    title: "Specifications are a starting point. Understanding is the goal.",
    paragraphs: storyParagraphs.slice(4, 6),
    accentBorder: "border-l-emerald-500",
    accentText: "text-emerald-700",
  },
  {
    eyebrow: "The bigger picture",
    title: "Beyond the product, the bigger picture.",
    paragraphs: storyParagraphs.slice(6, 7),
    accentBorder: "border-l-cyan-500",
    accentText: "text-cyan-700",
  },
  {
    eyebrow: "Our commitment",
    title: "A clearer place to understand what comes next.",
    paragraphs: storyParagraphs.slice(7),
    accentBorder: "border-l-violet-500",
    accentText: "text-violet-700",
  },
];

const journeySteps = [
  {
    label: "Discover",
    text: "Find product categories, launches, news, and innovation in one organized experience.",
  },
  {
    label: "Compare",
    text: "Read specifications and differences in a format built for practical decisions.",
  },
  {
    label: "Understand",
    text: "Move beyond the numbers and see what technology means for real use.",
  },
];

const coverageItems = [
  {
    title: "Smartphones",
    icon: FaMobileAlt,
    text: "Launches, pricing, variants, specifications, and comparison guidance.",
  },
  {
    title: "TVs",
    icon: FaTv,
    text: "Display technology, screen sizes, smart features, and home-viewing choices.",
  },
  {
    title: "Laptops",
    icon: FaLaptop,
    text: "Performance, portability, displays, storage, and everyday buying context.",
  },
  {
    title: "AI",
    icon: FaRobot,
    text: "Artificial intelligence features, tools, products, and real-world impact.",
  },
  {
    title: "Technology News",
    icon: FaNewspaper,
    text: "Launch updates, software changes, product coverage, and market movement.",
  },
  {
    title: "Science & Innovation",
    icon: FaAtom,
    text: "Research, space, digital transformation, and the ideas shaping tomorrow.",
  },
];

const coverageTones = [
  "border-t-blue-500 text-blue-700",
  "border-t-cyan-500 text-cyan-700",
  "border-t-emerald-500 text-emerald-700",
  "border-t-violet-500 text-violet-700",
  "border-t-rose-500 text-rose-700",
  "border-t-amber-500 text-amber-700",
];

const About = () => {
  useTitle({ page: "About TryHook" });

  const canonical = `${SITE_ORIGIN}/about`;
  const aboutSchema = createAboutPageSchema({
    name: "About TryHook",
    description:
      "TryHook helps people discover, compare, and understand technology through structured product information, meaningful comparisons, and clear editorial context.",
    url: canonical,
    organizationName: "TryHook",
  });

  return (
    <>
      <SEO
        title="About TryHook - Discover Technology, Compare Smarter"
        description="Learn why TryHook exists and how it helps users discover, compare, and understand smartphones, TVs, laptops, AI, technology news, and innovation."
        image={`${SITE_ORIGIN}/hook-logo.svg`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={aboutSchema}
      />

      <main className="min-h-screen bg-white text-slate-950">
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.74fr] lg:px-8 lg:py-20">
            <div className="flex flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                About Us
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                About TryHook
              </h1>
              <p className="mt-5 max-w-2xl text-xl font-semibold leading-8 text-blue-700">
                Discover Technology. Compare Smarter. Stay Informed.
              </p>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                TryHook exists to help people make sense of modern technology
                with clear product information, meaningful comparisons, and
                context that turns specifications into practical understanding.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/smartphones"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Explore Products
                  <FaArrowRight className="h-3.5 w-3.5" />
                </Link>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:text-blue-700"
                >
                  Contact Us
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    TryHook framework
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    From confusion to clarity
                  </p>
                </div>
                <span className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-blue-700">
                  Clear choices
                </span>
              </div>

              <ol className="divide-y divide-slate-200">
                {journeySteps.map((step, index) => (
                  <li
                    key={step.label}
                    className="grid grid-cols-[2.25rem_1fr] gap-4 py-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-sm font-black text-blue-700 ring-1 ring-slate-200">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block text-base font-black text-slate-950">
                        {step.label}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        {step.text}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Coverage
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {coverageItems.map((item, index) => {
                    const tone = coverageTones[index % coverageTones.length];
                    const chipClasses = tone
                      .split(" ")
                      .filter((className) => !className.startsWith("border-t-"))
                      .join(" ");

                    return (
                      <span
                        key={item.title}
                    className={`rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold ${chipClasses}`}
                      >
                        {item.title}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[14rem_1fr] lg:px-8 lg:py-16">
            <aside className="hidden lg:block">
              <div className="sticky top-24 border-l border-slate-200 pl-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Page Flow
                </p>
                <nav className="mt-5 space-y-3 text-sm font-semibold text-slate-500">
                  {storySections.map((section) => (
                    <a
                      key={section.eyebrow}
                      href={`#${section.eyebrow.toLowerCase().replace(/\s+/g, "-")}`}
                      className="block transition-colors hover:text-blue-700"
                    >
                      {section.eyebrow}
                    </a>
                  ))}
                  <a
                    href="#what-we-cover"
                    className="block transition-colors hover:text-blue-700"
                  >
                    What We Cover
                  </a>
                  <a
                    href="#contact"
                    className="block transition-colors hover:text-blue-700"
                  >
                    Contact
                  </a>
                </nav>
              </div>
            </aside>

            <div className="space-y-5">
              {storySections.map((section) => (
                <article
                  key={section.eyebrow}
                  id={section.eyebrow.toLowerCase().replace(/\s+/g, "-")}
                  className={`rounded-lg border border-slate-200 border-l-4 ${section.accentBorder} bg-white p-6 sm:p-8`}
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-[0.24em] ${section.accentText}`}
                  >
                    {section.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.72fr_1fr] lg:px-8 lg:py-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Mission & Vision
              </p>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                Built for clearer technology decisions.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                TryHook is designed to make discovery, comparison, and context
                feel connected instead of scattered across tabs and sources.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                  <FaArrowRight className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                  Our Mission
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-700">
                  Our mission is to make technology discovery clearer, calmer,
                  and more useful. We help users compare products with
                  organized data, readable explanations, and practical context
                  so they can understand what matters before they choose.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-amber-100 bg-white text-amber-700">
                  <FaEye className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
                  Our Vision
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-700">
                  Our vision is to become a trusted technology companion for
                  people who want to discover what is new, compare what matters,
                  and understand where innovation is heading without getting
                  lost in noise, hype, or fragmented information.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="what-we-cover" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                What We Cover
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                From product decisions to the bigger technology picture.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                TryHook covers the categories people research today and the
                innovation shaping what they will use tomorrow.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coverageItems.map((item, index) => {
                const Icon = item.icon;
                const tone = coverageTones[index % coverageTones.length];

                return (
                  <div
                    key={item.title}
                    className={`rounded-lg border border-slate-200 border-t-4 ${tone} bg-white p-6`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200 bg-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-black text-slate-950">
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

        <section id="contact" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Contact
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    Questions or feedback?
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                    Share product feedback, editorial suggestions, or questions
                    about TryHook. We read every relevant message carefully.
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-4 inline-flex break-all text-xl font-black text-blue-700 hover:text-blue-800"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <FaEnvelope className="h-4 w-4" />
                  Contact TryHook
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default About;
