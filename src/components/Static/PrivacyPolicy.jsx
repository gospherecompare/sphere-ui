import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaEnvelope,
  FaLeaf,
  FaLock,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createWebPageSchema } from "../../utils/schemaGenerators";

const updatedOn = "June 2, 2026";

const policyChips = [
  {
    icon: FaShieldAlt,
    label: "Transparent practices",
  },
  {
    icon: FaLock,
    label: "Protected access",
  },
  {
    icon: FaLeaf,
    label: "Minimal collection",
  },
];

const policySections = [
  {
    id: "information-we-collect",
    number: "1",
    title: "Information We Collect",
    summary:
      "We collect information you provide directly to us and a limited amount of technical data that helps the platform operate reliably.",
    paragraphs: [
      "Hooks is a product research and comparison platform. The information we collect is focused on operating your account, improving comparison experiences, and responding to support or partnership requests.",
    ],
    bullets: [
      "Information you provide: name, email address, login credentials, and any details you share when contacting us or subscribing for updates.",
      "Automatically collected information: browser type, device information, visited pages, time spent, referring URLs, and basic performance diagnostics.",
      "Communications data: messages sent to support, partnership, or privacy inboxes so we can respond and keep a record of the request.",
    ],
  },
  {
    id: "how-we-use-your-information",
    number: "2",
    title: "How We Use Your Information",
    summary:
      "We use the information we collect to deliver the service, keep it secure, and improve the quality of our product intelligence.",
    paragraphs: [
      "Hooks does not operate direct checkout for product purchases on this website. The information we process is used for platform administration, user support, analytics, and product experience improvements.",
    ],
    bullets: [
      "Provide, maintain, and improve the website and comparison tools.",
      "Personalize your experience, including search, saved preferences, and content relevance.",
      "Respond to your inquiries, account requests, and support needs.",
      "Send important updates, service notices, and optional news or marketing messages.",
      "Detect fraud, abuse, and technical issues that could affect platform security.",
    ],
  },
  {
    id: "information-sharing",
    number: "3",
    title: "Information Sharing",
    summary:
      "We do not sell your personal information. We share information only when it is necessary to operate the service or meet legal obligations.",
    paragraphs: [
      "When trusted vendors support the Hooks platform, they receive only the information needed to perform their work and remain subject to confidentiality and data-protection obligations.",
    ],
    bullets: [
      "With service providers that help us host the site, secure accounts, measure performance, or manage communications.",
      "When required by law, regulation, court order, or to protect rights, safety, and platform integrity.",
      "In connection with a merger, financing, acquisition, or business transfer, subject to appropriate safeguards.",
    ],
  },
  {
    id: "cookies-and-tracking-technologies",
    number: "4",
    title: "Cookies and Tracking Technologies",
    summary:
      "We use cookies and similar tools to remember settings, improve usability, and understand how people use the site.",
    paragraphs: [
      "Cookies help us keep sessions active, understand which pages are useful, and improve loading performance across devices.",
    ],
    bullets: [
      "Essential cookies support authentication, preferences, and security controls.",
      "Analytics cookies help us understand traffic patterns and product interest trends.",
      "Some browser or device-level tools may also store identifiers that help measure performance and diagnose issues.",
    ],
    cta: {
      label: "Contact us about cookie or tracking questions",
      href: "/contact",
    },
  },
  {
    id: "your-choices-and-rights",
    number: "5",
    title: "Your Choices and Rights",
    summary:
      "You may have rights to access, correct, delete, or object to certain uses of your personal information, depending on applicable law.",
    paragraphs: [
      "You can also opt out of optional promotional communications at any time. We will review verified requests in line with legal and operational requirements.",
    ],
    bullets: [
      "Request access to the personal information associated with your account.",
      "Ask us to correct inaccurate or incomplete details.",
      "Request deletion of eligible data when retention is no longer required.",
      "Manage marketing communication preferences through unsubscribe options or direct contact.",
    ],
    cta: {
      label: "Email privacy@hook.com",
      href: "mailto:privacy@hook.com",
    },
  },
  {
    id: "data-security",
    number: "6",
    title: "Data Security",
    summary:
      "We use technical and organizational safeguards designed to protect personal information from unauthorized access, misuse, or loss.",
    paragraphs: [
      "Our controls include role-based access, credential safeguards, encrypted transport, and monitoring that helps reduce operational risk. No internet-based system can guarantee absolute security, but we work to keep protections appropriate to the data we handle.",
    ],
  },
  {
    id: "data-retention",
    number: "7",
    title: "Data Retention",
    summary:
      "We keep information only for as long as needed to provide the service, comply with legal obligations, resolve disputes, and protect platform operations.",
    paragraphs: [
      "Retention periods vary depending on the type of information, the purpose for which it was collected, and whether the data is needed for security, compliance, or business continuity.",
    ],
  },
  {
    id: "childrens-privacy",
    number: "8",
    title: "Children's Privacy",
    summary:
      "Hooks is not directed to children under 13, and we do not knowingly collect personal information from children under 13.",
    paragraphs: [
      "If you believe a child has provided personal information to us, please contact us so we can review and take appropriate action.",
    ],
  },
  {
    id: "third-party-links",
    number: "9",
    title: "Third-Party Links",
    summary:
      "Our website may link to brand sites, marketplaces, or other third-party services that operate under their own privacy and commercial terms.",
    paragraphs: [
      "Hooks is not the merchant of record for purchases completed outside this website. We encourage you to read the privacy policies of any third-party property you visit from our platform.",
    ],
  },
  {
    id: "changes-to-this-policy",
    number: "10",
    title: "Changes to This Policy",
    summary:
      "We may update this Privacy Policy from time to time to reflect legal, operational, or product changes.",
    paragraphs: [
      "When we make material updates, we will revise the Last updated date on this page and may provide additional notice when appropriate.",
    ],
  },
];

const sectionIds = policySections.map((section) => section.id);

const scrollToPolicySection = (id) => {
  if (typeof window === "undefined") return;

  const target = document.getElementById(id);
  if (!target) return;

  window.history.replaceState(null, "", `#${id}`);
  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

const HeroIllustration = () => (
  <div className="relative mx-auto w-full max-w-[22rem]">
    <div className="relative rounded-[28px] bg-white p-6">
      <div className="rounded-[22px] bg-white p-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="h-2.5 w-14 rounded-full bg-blue-100" />
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-3 rounded-full bg-slate-100" />
          <div className="h-3 w-10/12 rounded-full bg-slate-100" />
          <div className="h-16 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50" />
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded-full bg-slate-100" />
              <div className="h-3 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 left-4 rounded-[28px] bg-gradient-to-br from-[#2550ff] to-[#1532a7] p-5 text-white shadow-[0_18px_42px_rgba(37,80,255,0.34)]">
        <FaLock className="h-10 w-10" />
      </div>

      <div className="absolute -right-1 bottom-4 flex h-24 w-20 items-end justify-center">
        <div className="relative h-20 w-10 rounded-t-full bg-[#82d0cf]/45">
          <span className="absolute -left-3 top-5 h-7 w-6 rounded-full bg-[#68c1c5]" />
          <span className="absolute left-6 top-0 h-8 w-6 rounded-full bg-[#7dd2ce]" />
          <span className="absolute -left-2 bottom-7 h-6 w-5 rounded-full bg-[#9adfd7]" />
          <span className="absolute -bottom-2 left-1/2 h-5 w-10 -translate-x-1/2 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  </div>
);

const PrivacyNoteCard = () => (
  <div className="rounded-[24px] bg-white p-5">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
      <FaUserShield className="h-5 w-5" />
    </div>
    <h3 className="mt-4 text-lg font-bold text-slate-900">Your privacy matters</h3>
    <p className="mt-2 text-sm leading-6 text-slate-600">
      We are committed to being transparent about how Hooks collects,
      safeguards, and uses information across the platform.
    </p>
    <a
      href="#your-choices-and-rights"
      onClick={(event) => {
        event.preventDefault();
        scrollToPolicySection("your-choices-and-rights");
      }}
      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
    >
      Learn more about your rights
      <FaArrowRight className="h-3.5 w-3.5" />
    </a>
  </div>
);

const SectionLink = ({ href, label }) => {
  if (!href || !label) return null;

  if (href.startsWith("/")) {
    return (
      <Link
        to={href}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
      >
        {label}
        <FaArrowRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition-colors hover:text-blue-800"
    >
      {label}
      <FaArrowRight className="h-3.5 w-3.5" />
    </a>
  );
};

const PolicyNavigation = ({
  activeSection,
  isMobile,
  onJump,
  open,
  onToggle,
}) => (
  <div className="rounded-[24px] bg-white">
    <button
      type="button"
      onClick={isMobile ? onToggle : undefined}
      className={`flex w-full items-center justify-between px-5 py-4 text-left ${
        isMobile ? "cursor-pointer" : "cursor-default"
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">On this page</p>
        <p className="mt-1 text-xs text-slate-500">
          Jump through the policy faster.
        </p>
      </div>
      {isMobile ? (
        <FaChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      ) : null}
    </button>

    <div className={`${isMobile && !open ? "hidden" : "block"} px-3 pb-3`}>
      <div className="space-y-1">
        {policySections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onJump(section.id)}
              className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`mt-0.5 inline-flex min-h-6 min-w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  isActive
                    ? "bg-white text-blue-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {section.number}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-5">
                {section.title}
              </span>
              <FaChevronRight
                className={`mt-1 h-3 w-3 shrink-0 ${
                  isActive ? "text-blue-600" : "text-slate-300"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

const PrivacyPolicy = () => {
  useTitle({ page: "Privacy Policy" });

  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const [openSection, setOpenSection] = useState(sectionIds[0]);
  const [mobileNavOpen, setMobileNavOpen] = useState(true);

  const canonical = "https://tryhook.shop/privacy-policy";
  const privacySchema = createWebPageSchema({
    name: "Privacy Policy",
    description:
      "Privacy policy for Hooks device comparison platform and data practices.",
    url: canonical,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentHash = window.location.hash.replace("#", "");
    if (!sectionIds.includes(currentHash)) return;

    setActiveSection(currentHash);
    setOpenSection(currentHash);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const targets = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!targets.length) return;

    if (typeof IntersectionObserver === "undefined") {
      setActiveSection(sectionIds[0]);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.2, 0.35, 0.55],
      },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const handleSectionJump = (id) => {
    setActiveSection(id);
    setOpenSection(id);
    setMobileNavOpen(false);
    scrollToPolicySection(id);
  };

  const toggleMobileSection = (id) => {
    setOpenSection((current) => (current === id ? "" : id));
  };

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

      <main className="relative overflow-hidden bg-white text-slate-900">
        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="overflow-hidden rounded-[32px] bg-white">
            <section className="border-b border-slate-200/80 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,360px)] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <Link
                      to="/"
                      className="font-medium transition-colors hover:text-slate-900"
                    >
                      Home
                    </Link>
                    <FaChevronRight className="h-3 w-3 text-slate-300" />
                    <span className="font-medium text-slate-700">
                      Privacy Policy
                    </span>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                    <FaShieldAlt className="h-3 w-3" />
                    Privacy Policy
                  </div>

                  <h1 className="mt-5 max-w-3xl font-heading text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
                    Privacy Policy
                  </h1>

                  <p className="mt-4 text-sm font-medium text-slate-500 sm:text-base">
                    Last updated: {updatedOn}
                  </p>

                  <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                    At Hooks, your privacy matters. This policy explains what
                    information we collect, how we use it, when we share it, and
                    the choices available to you while using our comparison
                    platform.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {policyChips.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600"
                        >
                          <Icon className="h-4 w-4 text-blue-600" />
                          <span>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <HeroIllustration />
              </div>
            </section>

            <section className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
              <div className="space-y-4 lg:hidden">
                <PolicyNavigation
                  activeSection={activeSection}
                  isMobile
                  onJump={handleSectionJump}
                  open={mobileNavOpen}
                  onToggle={() => setMobileNavOpen((current) => !current)}
                />
                <PrivacyNoteCard />
              </div>

              <div className="mt-4 grid gap-8 lg:mt-0 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                  <div className="sticky top-[7.75rem] space-y-4">
                    <PolicyNavigation
                      activeSection={activeSection}
                      isMobile={false}
                      onJump={handleSectionJump}
                      open
                    />
                    <PrivacyNoteCard />
                  </div>
                </aside>

                <div className="min-w-0">
                  <div className="space-y-5">
                    {policySections.map((section) => {
                      const isOpen = openSection === section.id;

                      return (
                        <article
                          key={section.id}
                          id={section.id}
                          className="scroll-mt-36 rounded-[26px] bg-white"
                        >
                          <button
                            type="button"
                            onClick={() => toggleMobileSection(section.id)}
                            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left lg:hidden"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                                {section.number}
                              </span>
                              <div className="min-w-0">
                                <h2 className="text-lg font-bold text-slate-900">
                                  {section.title}
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-slate-500">
                                  {section.summary}
                                </p>
                              </div>
                            </div>
                            <FaChevronDown
                              className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          <div className="hidden border-b border-slate-100 px-7 py-6 lg:block">
                            <div className="flex items-start gap-4">
                              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-base font-bold text-blue-700">
                                {section.number}
                              </span>
                              <div>
                                <h2 className="text-[1.75rem] font-black tracking-[-0.04em] text-slate-950">
                                  {section.title}
                                </h2>
                                <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600">
                                  {section.summary}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`px-5 pb-5 lg:block lg:px-7 lg:pb-7 lg:pt-6 ${
                              isOpen ? "block" : "hidden"
                            }`}
                          >
                            <div className="space-y-4">
                              {section.paragraphs?.map((paragraph) => (
                                <p
                                  key={paragraph}
                                  className="text-sm leading-7 text-slate-600 sm:text-base"
                                >
                                  {paragraph}
                                </p>
                              ))}

                              {section.bullets?.length ? (
                                <ul className="space-y-3">
                                  {section.bullets.map((bullet) => (
                                    <li
                                      key={bullet}
                                      className="flex items-start gap-3 text-sm leading-7 text-slate-600 sm:text-base"
                                    >
                                      <FaCheckCircle className="mt-1 h-4 w-4 shrink-0 text-blue-600" />
                                      <span>{bullet}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}

                              {section.cta ? (
                                <SectionLink
                                  href={section.cta.href}
                                  label={section.cta.label}
                                />
                              ) : null}

                              {section.contactLinks?.length ? (
                                <div className="rounded-[22px] bg-slate-50 p-4 sm:p-5">
                                  <p className="text-sm font-semibold text-slate-900">
                                    Contact points
                                  </p>
                                  <div className="mt-4 space-y-3">
                                    {section.contactLinks.map((item) => (
                                      <div
                                        key={item.label}
                                        className="flex items-center gap-3"
                                      >
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-700">
                                          <FaEnvelope className="h-4 w-4" />
                                        </span>
                                        <SectionLink
                                          href={item.href}
                                          label={item.label}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default PrivacyPolicy;
