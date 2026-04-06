import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBalanceScale,
  FaBan,
  FaClock,
  FaExclamationTriangle,
  FaCheck,
  FaLink,
  FaShieldAlt,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createWebPageSchema } from "../../utils/schemaGenerators";

const termsHighlights = [
  {
    title: "Not a store",
    text: "Hooks is a comparison platform, not a checkout or fulfillment service.",
  },
  {
    title: "Data can change",
    text: "Specs, prices, and availability may change without notice from source updates.",
  },
  {
    title: "Use responsibly",
    text: "Abuse, scraping that harms service reliability, and unauthorized access are not allowed.",
  },
];

const termsSections = [
  {
    icon: FaBalanceScale,
    title: "Acceptance and scope",
    text: "Access to Hooks constitutes acceptance of these terms. Hooks functions as a device research and comparison platform that publishes structured specifications, pricing references, trend indicators, and decision-support insights. The service is designed to support informed product evaluation and does not replace independent buyer verification where material purchase decisions are involved.",
  },
  {
    icon: FaShieldAlt,
    title: "Platform nature",
    text: "Hooks is not a direct seller of products on this website. No checkout operation is provided for product purchases, and no card, UPI, bank, or wallet payment credentials are collected by Hooks for marketplace transactions. Returns, refunds, shipping commitments, warranties, cancellations, and after-sales obligations remain exclusively with the third-party seller or official brand store where a transaction is completed.",
  },
  {
    icon: FaClock,
    title: "Information accuracy",
    text: "Product data, pricing snapshots, and availability indicators may change without prior notice due to source updates, regional variance, launch-stage changes, or seller-side modifications. Although reasonable efforts are applied to maintain current information quality, no representation is made that every listing remains complete, error-free, or continuously available. Critical commercial details should be confirmed with the relevant seller or official brand source before any purchase action.",
  },
  {
    icon: FaBan,
    title: "Acceptable use",
    text: "Use of the platform must remain lawful and non-disruptive. Unauthorized system access, automated abuse, data scraping intended to harm service reliability, reverse engineering, impersonation, and any conduct that interferes with platform integrity are prohibited. Feedback or feature suggestions submitted to Hooks may be used on a non-exclusive basis for product improvement; personally identifying attribution is not published without explicit consent.",
  },
  {
    icon: FaLink,
    title: "External links and liability",
    text: "External links are provided for user convenience. Third-party websites operate under independent legal, privacy, and commercial terms outside Hooks control. To the extent permitted by applicable law, Hooks disclaims liability for third-party transaction outcomes, seller conduct, and off-platform contractual disputes. These terms are interpreted under applicable law in the jurisdiction of platform operation, subject to mandatory statutory consumer protections. Legal inquiries may be directed to legal@hook.com.",
  },
];

const reviewNotes = [
  "Always verify critical purchase details with the seller or brand store.",
  "Do not use the platform in ways that slow down or damage service reliability.",
  "Third-party websites follow their own terms, privacy policies, and refund rules.",
  "Contact the relevant party directly for transaction or legal questions.",
];

const Terms = () => {
  useTitle({ page: "Terms" });

  const updatedOn = "March 9, 2026";
  const canonical = "https://tryhook.shop/terms";
  const termsSchema = createWebPageSchema({
    name: "Terms and Conditions",
    description:
      "Terms and conditions for using Hooks device comparison platform.",
    url: canonical,
  });

  return (
    <>
      <SEO
        title="Terms and Conditions - Device Comparison Platform - Hooks"
        description="Read the Terms and Conditions for using Hooks. We're a device comparison platform, not an e-commerce store."
        image={`${canonical}/og-image`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={termsSchema}
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
                Terms and Conditions
              </span>

              <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Terms, explained clearly.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                These terms explain how Hooks works, what users can expect from
                the platform, and how third-party links and content should be
                used.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                Last updated: {updatedOn}
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {termsHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    {item.text}
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
                Key terms
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                What these terms cover
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The full terms are grouped into compact sections so the page
                stays readable on mobile and desktop alike.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {termsSections.map((section) => {
                const Icon = section.icon;

                return (
                  <article
                    key={section.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">
                        {section.title}
                      </h3>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                      {section.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Before you use Hooks
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  A few practical reminders.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  These notes help set the right expectations when browsing
                  product pages, comparing devices, or opening external links.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                  <FaExclamationTriangle className="h-4 w-4 text-amber-500" />
                  Please verify commercial details before buying.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <ul className="space-y-3">
                  {reviewNotes.map((note) => (
                    <li key={note} className="flex items-start gap-3">
                      <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                        <FaCheck className="h-3 w-3" />
                      </span>
                      <span className="text-sm leading-7 text-slate-600 sm:text-base">
                        {note}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-slate-800"
                  >
                    Contact us
                    <FaArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    to="/privacy-policy"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Privacy Policy
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

export default Terms;
