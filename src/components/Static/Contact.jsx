import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBullhorn,
  FaCommentDots,
  FaEnvelope,
  FaShieldAlt,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createContactPageSchema } from "../../utils/schemaGenerators";

const contactEmail = "gospherecompare@gmail.com";

const contactHighlights = [
  {
    icon: FaBullhorn,
    title: "Partnerships",
    text: "Brand collaborations, data partnerships, or media inquiries.",
  },
  {
    icon: FaCommentDots,
    title: "Feedback",
    text: "Questions about product pages, search, or the comparison experience.",
  },
  {
    icon: FaShieldAlt,
    title: "Corrections",
    text: "Report listing issues, outdated specs, or broken links.",
  },
];

const contactNotes = [
  "Include the page URL or product name when reporting an issue.",
  "Mention whether the request is about partnerships, feedback, or corrections.",
  "Keep the message short and clear so we can route it quickly.",
];

const quickLinks = [
  { label: "About Hooks", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
];

const Contact = () => {
  useTitle({ page: "Contact" });

  const canonical = "https://tryhook.shop/contact";
  const contactSchema = createContactPageSchema({
    name: "Contact Hooks",
    description:
      "Get in touch with Hooks for product inquiries, feedback, partnerships, or general support.",
    url: canonical,
    contactEmail,
  });

  return (
    <>
      <SEO
        title="Contact Hooks - Device Comparison Platform Support"
        description="Get in touch with Hooks for product inquiries, feedback, partnerships, or general support on our device comparison platform."
        image={`${canonical}/og-image`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={contactSchema}
      />

      <main className="min-h-screen bg-slate-50 text-slate-900">
        <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white">
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/10 to-transparent" />

          <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-24">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                  <FaEnvelope className="h-3.5 w-3.5" />
                  Contact Hooks
                </span>

                <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                  Let us know what you need.
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                  For partnerships, feedback, corrections, or general support,
                  email us directly and we'll route the message to the right
                  place.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${contactEmail}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
                  >
                    Email us
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </a>
                  <Link
                    to="/about"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/30 hover:bg-white/15"
                  >
                    About Hooks
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                  Primary contact
                </p>
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-3 inline-flex items-center gap-2 text-lg font-bold text-white transition-colors duration-200 hover:text-cyan-100"
                >
                  {contactEmail}
                </a>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  This inbox handles partnerships, support questions, and
                  corrections for the platform.
                </p>

                <div className="mt-6 grid gap-3">
                  {contactHighlights.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.title}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-cyan-100">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h2 className="text-sm font-semibold text-white">
                              {item.title}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-white/70">
                              {item.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Before you email
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                A few things to include.
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                A short, specific message helps us respond faster and keeps the
                conversation focused.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <ul className="space-y-3">
                  {contactNotes.map((note) => (
                    <li key={note} className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                        <FaArrowRight className="h-3 w-3" />
                      </span>
                      <span className="text-sm leading-7 text-slate-600 sm:text-base">
                        {note}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-cyan-100">
                    <FaEnvelope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Contact email
                    </p>
                    <a
                      href={`mailto:${contactEmail}`}
                      className="mt-1 block text-lg font-bold text-slate-900 transition-colors duration-200 hover:text-blue-700"
                    >
                      {contactEmail}
                    </a>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span>{item.label}</span>
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Contact;
