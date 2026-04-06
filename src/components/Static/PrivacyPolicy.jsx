import React from "react";
import {
  FaDatabase,
  FaEnvelope,
  FaLink,
  FaLock,
  FaShieldAlt,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createWebPageSchema } from "../../utils/schemaGenerators";

const policyHighlights = [
  {
    title: "No direct sales",
    text: "Hooks does not sell products or process checkout payments on this site.",
  },
  {
    title: "Limited collection",
    text: "We collect only the details needed for accounts, support, and platform reliability.",
  },
  {
    title: "Protected access",
    text: "Role-based access, credential safeguards, and monitoring help protect stored data.",
  },
];

const policySections = [
  {
    icon: FaShieldAlt,
    title: "Overview and scope",
    text: "Hooks operates as a product research and comparison platform that publishes structured device insights, specifications, price references, and decision-support content. Hooks is not a direct seller of products on this website. No checkout flow is operated for product purchases, no card, UPI, or bank payment credentials are collected for transactions, and no return or refund process is administered for third-party stores.",
  },
  {
    icon: FaDatabase,
    title: "Information we collect",
    text: "Data collection is limited to information required for legitimate platform operations. This may include account identifiers such as name, email address, and authentication credentials, session-level technical telemetry including device type, browser, visited pages, and performance diagnostics, and communications submitted through support or partnership channels. For business collaboration workflows, professional contact information and operational correspondence may be processed as required.",
  },
  {
    icon: FaLock,
    title: "How we use information",
    text: "Processing activities are restricted to service reliability, comparison-quality improvement, misuse detection, account security, and support fulfilment. Personal information is not sold, and confidential business information is not repurposed for unrelated commercial objectives. Data access is controlled by role-based authorization and business necessity. Infrastructure, analytics, and communication vendors are engaged only under binding confidentiality and data-protection obligations.",
  },
  {
    icon: FaLink,
    title: "Third-party services",
    text: "Links to external marketplaces or official brand stores are governed by third-party terms. Those third-party properties independently control transaction handling, payment processing, shipping commitments, return rules, refund conditions, and privacy practices. Hooks is not the merchant of record for purchases completed outside this website.",
  },
  {
    icon: FaEnvelope,
    title: "Security, retention, and requests",
    text: "Security controls include restricted access, credential safeguards, encrypted transport, and monitoring measures designed to reduce operational risk. Data is retained only for lawful service, legal, security, and compliance requirements, and is deleted or anonymized under internal retention schedules once no longer required. Requests for access, correction, or deletion of eligible personal information may be sent to privacy@hook.com. Platform support requests may be sent to support@hook.com. Policy updates are reflected on this page with a revised effective date.",
  },
];

const PrivacyPolicy = () => {
  useTitle({ page: "Privacy Policy" });

  const updatedOn = "March 9, 2026";
  const canonical = "https://tryhook.shop/privacy-policy";
  const privacySchema = createWebPageSchema({
    name: "Privacy Policy",
    description:
      "Privacy policy for Hooks device comparison platform and data practices.",
    url: canonical,
  });

  return (
    <>
      <SEO
        title="Privacy Policy - Data Protection - Hooks Device Comparison"
        description="Read our privacy policy to understand how Hooks collects, uses, and protects your information across the platform."
        image={`${canonical}/og-image`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={privacySchema}
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
                Privacy Policy
              </span>

              <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Privacy, explained clearly.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
                Learn how Hooks collects, uses, and protects information while
                you browse product comparisons, open device pages, and contact
                us for support.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                Last updated: {updatedOn}
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {policyHighlights.map((item) => (
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
                Policy at a glance
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                What this policy covers
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The sections below keep the legal content readable on desktop
                and mobile while preserving the full policy language.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {policySections.map((section) => {
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

      </main>
    </>
  );
};

export default PrivacyPolicy;
