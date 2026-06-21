import React from "react";
import { Link } from "react-router-dom";
import {
  FaAd,
  FaArrowRight,
  FaCookieBite,
  FaEnvelope,
  FaExternalLinkAlt,
  FaLock,
  FaServer,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createWebPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://tryhook.shop";
const CONTACT_EMAIL = "contact@tryhook.shop";
const updatedOn = "June 2026";

const policySections = [
  {
    id: "overview",
    number: "1",
    title: "Overview",
    icon: FaShieldAlt,
    paragraphs: [
      "At TryHook, we respect the privacy of our visitors and are committed to protecting the information that is shared with us. This Privacy Policy explains how information is collected, used, stored, and protected when you access and use the TryHook website. By visiting or using our platform, you agree to the practices described in this policy.",
      "TryHook is a technology discovery, comparison, and news platform that provides information related to consumer electronics, technology, artificial intelligence, science, internet services, and digital innovation. As part of operating and improving our services, certain information may be collected when users interact with the website.",
    ],
  },
  {
    id: "information-collected-automatically",
    number: "2",
    title: "Information Collected Automatically",
    icon: FaServer,
    paragraphs: [
      "When you visit TryHook, some information is collected automatically through standard web technologies. This may include details such as your device type, browser information, operating system, IP address, pages visited, time spent on the website, referral sources, and general usage patterns.",
      "This information helps us understand how visitors use the platform, identify technical issues, improve performance, and enhance the overall user experience. Information collected for analytics purposes is generally used in an aggregated form and is not intended to personally identify individual users.",
    ],
  },
  {
    id: "information-you-provide",
    number: "3",
    title: "Information You Provide",
    icon: FaUserCheck,
    paragraphs: [
      "In certain situations, you may voluntarily provide information to us. For example, you may contact us by email, submit feedback, report an issue, request support, or communicate with us regarding partnerships and business inquiries.",
      "In such cases, the information you provide may include your name, email address, and any details included in your communication. We use this information solely for responding to inquiries, improving our services, and maintaining communication where necessary.",
    ],
  },
  {
    id: "cookies",
    number: "4",
    title: "Cookies and Similar Technologies",
    icon: FaCookieBite,
    paragraphs: [
      "Like most modern websites, TryHook may use cookies and similar technologies to improve functionality and provide a better browsing experience. Cookies help us understand user preferences, analyze website traffic, remember certain settings, and measure the effectiveness of content and services.",
      "Cookies do not generally provide us with sensitive personal information, but they may help us improve how the website functions and how content is delivered to visitors. Users can choose to disable cookies through their browser settings, although certain features of the website may not function as intended if cookies are disabled.",
    ],
  },
  {
    id: "third-party-providers",
    number: "5",
    title: "Third-Party Providers",
    icon: FaExternalLinkAlt,
    paragraphs: [
      "To improve our services and maintain the website, TryHook may use trusted third-party providers for analytics, security, hosting, content delivery, communication, and advertising. These providers may process information according to their own privacy policies and legal obligations.",
      "Services such as website analytics platforms, hosting providers, content delivery networks, and advertising partners may collect limited technical information necessary for their services to function properly.",
    ],
  },
  {
    id: "advertising",
    number: "6",
    title: "Advertising Partners",
    icon: FaAd,
    paragraphs: [
      "As TryHook continues to grow, advertisements may be displayed through advertising partners such as Google AdSense and other advertising networks. These partners may use cookies, device identifiers, and similar technologies to deliver relevant advertisements and measure advertising performance.",
      "Advertising providers operate under their own privacy policies, and users are encouraged to review those policies for additional information regarding data collection and advertising preferences.",
    ],
  },
  {
    id: "security",
    number: "7",
    title: "Data Security",
    icon: FaLock,
    paragraphs: [
      "Protecting user information is important to us. We implement reasonable technical and organizational measures designed to safeguard information from unauthorized access, misuse, alteration, disclosure, or destruction.",
      "While we strive to maintain a secure environment, no method of electronic transmission or storage can guarantee absolute security. As a result, we cannot guarantee complete protection against every potential security risk.",
    ],
  },
  {
    id: "external-links",
    number: "8",
    title: "External Links",
    icon: FaExternalLinkAlt,
    paragraphs: [
      "TryHook may contain links to third-party websites, products, services, or resources that are not controlled or operated by us. Once you leave our website, the privacy practices of those external websites are governed by their own policies.",
      "We encourage users to review the privacy policies of any third-party websites they visit, as we are not responsible for their content, security practices, or data handling procedures.",
    ],
  },
  {
    id: "children",
    number: "9",
    title: "Children's Privacy",
    icon: FaUserCheck,
    paragraphs: [
      "Our website is intended for a general audience and is not specifically directed toward children under the age of 13. We do not knowingly collect personal information from children.",
      "If we become aware that information from a child has been collected without appropriate consent, we will take reasonable steps to remove that information.",
    ],
  },
  {
    id: "updates-and-contact",
    number: "10",
    title: "Policy Updates and Contact",
    icon: FaEnvelope,
    paragraphs: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, legal requirements, technologies, or business practices. Any updates will be published on this page along with the revised effective date.",
      "Continued use of the website after changes have been posted constitutes acceptance of the updated policy. If you have any questions regarding this Privacy Policy, your privacy rights, or the way information is handled on TryHook, please contact us at contact@tryhook.shop. We will make reasonable efforts to respond to inquiries and address concerns in a timely manner.",
      "Thank you for trusting TryHook as your destination for technology discovery, comparisons, and technology news.",
    ],
  },
];

const PrivacyPolicy = () => {
  useTitle({ page: "Privacy Policy" });

  const canonical = `${SITE_ORIGIN}/privacy-policy`;
  const privacySchema = createWebPageSchema({
    name: "Privacy Policy",
    description:
      "Privacy Policy for TryHook, explaining how information is collected, used, stored, protected, and handled across the technology discovery and comparison platform.",
    url: canonical,
  });

  return (
    <>
      <SEO
        title="Privacy Policy - TryHook"
        description="Read the TryHook Privacy Policy to understand how information is collected, used, stored, protected, and handled when you use the website."
        image={`${SITE_ORIGIN}/hook-logo.svg`}
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={privacySchema}
      />

      <main className="min-h-screen bg-white text-slate-950">
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_0.4fr] lg:px-8 lg:py-16">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <Link
                  to="/"
                  className="font-medium transition-colors hover:text-slate-900"
                >
                  Home
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-700">
                  Privacy Policy
                </span>
              </div>

              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                Privacy Policy
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
                Privacy Policy
              </h1>
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Last Updated: {updatedOn}
              </p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                This policy explains how TryHook collects, uses, stores, and
                protects information when visitors use our technology discovery,
                comparison, and news platform.
              </p>
            </div>

            <div className="rounded-lg border border-blue-100 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                <FaShieldAlt className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-black text-slate-950">
                Your privacy matters.
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                TryHook uses information to improve reliability, answer
                inquiries, support analytics, and maintain a better browsing
                experience.
              </p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
              >
                {CONTACT_EMAIL}
                <FaArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[16rem_1fr] lg:px-8 lg:py-14">
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-lg border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                  Contents
                </p>
                <nav className="mt-4 space-y-1">
                  {policySections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-start gap-3 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="text-blue-700">{section.number}</span>
                      <span>{section.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="space-y-4">
              {policySections.map((section) => {
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
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                          {section.title}
                        </h2>
                        <div className="mt-5 space-y-4 text-base leading-8 text-slate-700">
                          {section.paragraphs.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-blue-100 bg-white p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700">
                    Contact
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    Questions about this policy?
                  </h2>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-3 inline-flex break-all text-lg font-black text-blue-700 hover:text-blue-800"
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

export default PrivacyPolicy;
