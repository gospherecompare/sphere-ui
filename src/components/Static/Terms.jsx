import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBalanceScale,
  FaBan,
  FaBookOpen,
  FaEnvelope,
  FaExternalLinkAlt,
  FaFileContract,
  FaGlobe,
  FaInfoCircle,
  FaNewspaper,
  FaPen,
  FaShieldAlt,
  FaTags,
  FaUserCheck,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createWebPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://tryhook.shop";
const CONTACT_EMAIL = "contact@tryhook.shop";
const effectiveDate = "June 2026";

const agreementSummary = [
  {
    icon: FaInfoCircle,
    title: "Informational platform",
    text: "TryHook helps people discover, compare, and understand technology.",
  },
  {
    icon: FaTags,
    title: "Verify key details",
    text: "Specifications, prices, and availability can change over time.",
  },
  {
    icon: FaShieldAlt,
    title: "Use responsibly",
    text: "Access must remain lawful, personal, and non-disruptive.",
  },
];

const termsSections = [
  {
    id: "acceptance-of-terms",
    number: "1",
    title: "Acceptance of Terms",
    icon: FaFileContract,
    paragraphs: [
      "These Terms and Conditions constitute a legally binding agreement between you and TryHook. Your continued use of the website following the publication of any updates constitutes acceptance of the revised terms. TryHook reserves the right to amend these terms at any time, with the effective date published on this page.",
    ],
  },
  {
    id: "about-tryhook",
    number: "2",
    title: "About TryHook",
    icon: FaInfoCircle,
    paragraphs: [
      "TryHook is a technology discovery, comparison, and editorial news platform delivering information on consumer electronics, software, artificial intelligence, science, internet services, and digital innovation. All content published on TryHook is intended strictly for informational and educational purposes.",
    ],
  },
  {
    id: "permitted-use",
    number: "3",
    title: "Permitted Use of the Platform",
    icon: FaUserCheck,
    paragraphs: [
      "You are granted a limited, non-exclusive, non-transferable right to access and use TryHook for personal, non-commercial purposes, subject to these terms. The following activities are strictly prohibited:",
    ],
    bullets: [
      "Unauthorised access to or interference with platform systems or infrastructure",
      "Large-scale automated scraping, crawling, or data extraction",
      "Distribution of malicious software, spam, or harmful content",
      "Exploitation of platform vulnerabilities or security weaknesses",
      "Any activity that disrupts, degrades, or impairs platform operations",
    ],
  },
  {
    id: "content-accuracy",
    number: "4",
    title: "Content Accuracy and Reliability",
    icon: FaBookOpen,
    paragraphs: [
      "TryHook is committed to providing accurate, current, and reliable information. However, technology products, specifications, pricing, availability, and service features are subject to change without notice. While reasonable efforts are made to ensure accuracy, TryHook does not warrant that all published information will be complete, error-free, or up to date at all times.",
      "Users are advised to independently verify all material information directly with manufacturers, retailers, or authorised service providers prior to making any purchasing or business decisions.",
    ],
  },
  {
    id: "product-specifications-and-pricing",
    number: "5",
    title: "Product Specifications and Pricing",
    icon: FaTags,
    paragraphs: [
      "All product specifications, pricing data, launch details, and feature descriptions published on TryHook are provided for informational purposes only and may not reflect the most current updates from manufacturers or retail partners. TryHook shall not be held liable for any purchasing decisions, pricing discrepancies, product availability changes, or financial losses arising from reliance on such information.",
    ],
  },
  {
    id: "editorial-and-news-content",
    number: "6",
    title: "Editorial and News Content",
    icon: FaNewspaper,
    paragraphs: [
      "News articles, technology analysis, commentary, and editorial content published on TryHook are designed to inform readers about developments within the technology industry. Opinions, interpretations, and editorial perspectives expressed in certain content reflect the views of the respective authors and do not constitute professional, legal, financial, medical, or investment advice.",
    ],
  },
  {
    id: "intellectual-property-rights",
    number: "7",
    title: "Intellectual Property Rights",
    icon: FaPen,
    paragraphs: [
      "Unless expressly stated otherwise, all content published on TryHook, including but not limited to text, design elements, graphics, logos, branding, articles, product comparisons, databases, and website features, is the proprietary property of TryHook or its respective content owners and is protected by applicable intellectual property laws.",
      "Reproduction, republication, redistribution, modification, sale, or commercial exploitation of any platform content without prior written permission from TryHook is strictly prohibited. Fair use quotation with appropriate attribution and a direct link to the original source may be permitted on a case-by-case basis.",
    ],
  },
  {
    id: "third-party-links",
    number: "8",
    title: "Third-Party Links and Resources",
    icon: FaExternalLinkAlt,
    paragraphs: [
      "TryHook may include links to third-party websites, products, and services for user convenience. The inclusion of such links does not constitute an endorsement of, or responsibility for, third-party content, policies, or practices. TryHook does not control external websites and accepts no liability for their availability, accuracy, security, or content. Users access third-party resources at their sole discretion and risk.",
    ],
  },
  {
    id: "limitation-of-liability",
    number: "9",
    title: "Limitation of Liability",
    icon: FaBan,
    paragraphs: [
      "To the fullest extent permitted by applicable law, TryHook, its owners, contributors, affiliates, partners, and representatives shall not be liable for any direct, indirect, incidental, consequential, special, or punitive damages arising from:",
    ],
    bullets: [
      "The use of, or inability to use, the TryHook platform",
      "Reliance on any information, content, or data published on the website",
      "Purchasing or business decisions made based on platform content",
      "Data loss, service interruptions, or technical errors",
      "Third-party actions, content, or services accessed via the platform",
    ],
  },
  {
    id: "user-responsibilities",
    number: "10",
    title: "User Responsibilities",
    icon: FaUserCheck,
    paragraphs: [
      "Users bear sole responsibility for independently evaluating all information prior to making any purchasing, business, educational, or personal decisions based on content available on the platform. Users are further responsible for maintaining the security of their own devices, internet connections, and any accounts or credentials used to access online services.",
    ],
  },
  {
    id: "amendments",
    number: "11",
    title: "Amendments to These Terms",
    icon: FaPen,
    paragraphs: [
      "TryHook reserves the right to modify, update, or replace these Terms and Conditions at any time without prior notice. The revised version, along with the updated effective date, will be published on this page. Continued use of the platform following the publication of any amendments constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "governing-law",
    number: "12",
    title: "Governing Law",
    icon: FaBalanceScale,
    paragraphs: [
      "These Terms and Conditions shall be governed by and construed in accordance with the applicable laws and regulations of the jurisdiction in which TryHook operates, without regard to its conflict of law provisions.",
    ],
  },
  {
    id: "contact-information",
    number: "13",
    title: "Contact Information",
    icon: FaEnvelope,
    paragraphs: [
      "For any enquiries or concerns relating to these Terms and Conditions, please contact TryHook using the email address below.",
    ],
  },
];

const Terms = () => {
  useTitle({ page: "Terms & Conditions" });

  const canonical = `${SITE_ORIGIN}/terms`;
  const termsSchema = createWebPageSchema({
    name: "Terms & Conditions",
    description:
      "Terms and Conditions governing access to and use of the TryHook technology discovery, comparison, and editorial platform.",
    url: canonical,
  });

  return (
    <>
      <SEO
        title="Terms & Conditions - TryHook"
        description="Read the Terms and Conditions governing access to and use of the TryHook technology discovery, comparison, and editorial platform."
        image={`${SITE_ORIGIN}/hook-logo.svg`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={termsSchema}
      />

      <main className="min-h-screen bg-white text-slate-950">
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Link
                to="/"
                className="font-medium transition-colors hover:text-slate-900"
              >
                Home
              </Link>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-700">
                Terms &amp; Conditions
              </span>
            </div>

            <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.48fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Legal &amp; Compliance
                </p>
                <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                  Terms &amp; Conditions
                </h1>
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Effective Date: {effectiveDate}
                </p>
                <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                  Welcome to TryHook. These Terms and Conditions govern your
                  access to and use of the TryHook platform. By accessing or
                  using this website, you acknowledge that you have read,
                  understood, and agree to be bound by these terms. If you do
                  not agree with any provision herein, please discontinue use
                  of this website immediately.
                </p>
              </div>

              <div className="rounded-lg border border-blue-100 bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                  <FaFileContract className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-black text-slate-950">
                  Agreement at a glance
                </h2>
                <div className="mt-5 space-y-5">
                  {agreementSummary.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <Icon className="mt-1 h-4 w-4 shrink-0 text-blue-700" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-950">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {item.text}
                          </p>
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
          <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-16">
            <details className="mb-8 rounded-lg border border-slate-200 bg-white p-5 lg:hidden">
              <summary className="cursor-pointer text-sm font-bold text-slate-950">
                Table of Contents
              </summary>
              <nav className="mt-4 grid gap-1 sm:grid-cols-2">
                {termsSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="mr-2 text-blue-700">
                      {section.number}.
                    </span>
                    {section.title}
                  </a>
                ))}
              </nav>
            </details>

            <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
              <aside className="hidden lg:block">
                <nav
                  aria-label="Terms and Conditions sections"
                  className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Table of Contents
                  </p>
                  <div className="mt-4 space-y-1">
                    {termsSections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="flex items-start gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                      >
                        <span className="shrink-0 text-blue-700">
                          {section.number}
                        </span>
                        <span>{section.title}</span>
                      </a>
                    ))}
                  </div>
                </nav>
              </aside>

              <div className="space-y-4">
                {termsSections.map((section) => {
                  const Icon = section.icon;

                  return (
                    <article
                      key={section.id}
                      id={section.id}
                      className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-6 sm:p-8"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                            Section {section.number}
                          </p>
                          <h2 className="mt-2 text-2xl font-black text-slate-950">
                            {section.title}
                          </h2>
                          <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                            {section.paragraphs.map((paragraph) => (
                              <p key={paragraph}>{paragraph}</p>
                            ))}
                          </div>

                          {section.bullets && (
                            <ul className="mt-5 space-y-3 pl-5 text-base leading-7 text-slate-700">
                              {section.bullets.map((bullet) => (
                                <li key={bullet} className="list-disc pl-1 marker:text-blue-600">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}

                          {section.id === "contact-information" && (
                            <a
                              href={`mailto:${CONTACT_EMAIL}`}
                              className="mt-5 inline-flex break-all text-lg font-black text-blue-700 hover:text-blue-800"
                            >
                              {CONTACT_EMAIL}
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-16">
            <div className="rounded-lg border border-blue-100 bg-white p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Legal Contact
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    Questions about these terms?
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                    Contact TryHook for enquiries or concerns relating to these
                    Terms and Conditions.
                  </p>
                </div>

                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <FaEnvelope className="h-4 w-4" />
                  {CONTACT_EMAIL}
                  <FaArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Terms;
