import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaCommentDots,
  FaEnvelope,
  FaHeadphones,
  FaPaperPlane,
  FaUserFriends,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import { createContactPageSchema } from "../../utils/schemaGenerators";
import {
  hookContactChannels,
  primaryContactEmail,
  supportContactEmail,
} from "../../utils/hookContactChannels";

const contactEmail = primaryContactEmail;
const contactPageChannels = hookContactChannels.filter((channel) =>
  ["contact", "support"].includes(channel.key),
);
const getContactApiBase = () => {
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase) return String(envBase).replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const hostname = String(window.location.hostname || "").toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    ) {
      return "http://localhost:5000";
    }
  }

  return "https://api.apisphere.in";
};
const CONTACT_API_BASE = (
  getContactApiBase()
).replace(/\/$/, "");
const CONTACT_API_URL = `${CONTACT_API_BASE}/api/contact-submissions`;

const supportPillars = [
  {
    icon: FaClock,
    title: "Quick response",
    text: "We review product questions, corrections, and support messages as quickly as possible.",
  },
  {
    icon: FaEnvelope,
    title: "Structured requests",
    text: "Share links, context, screenshots, or exact details so we can route your message clearly.",
  },
  {
    icon: FaUserFriends,
    title: "Human review",
    text: "Feedback, partnership notes, editorial leads, and platform questions are reviewed with care.",
  },
];

const subjectOptions = [
  {
    value: "general-support",
    label: "General contact",
    description: "Questions that should be routed to the right TryHook inbox.",
    routingEmail: contactEmail,
  },
  {
    value: "product-correction",
    label: "Product correction",
    description: "Report incorrect specs, prices, or page details.",
    routingEmail: supportContactEmail,
  },
  {
    value: "feature-request",
    label: "Feature request",
    description: "Suggest a new tool, flow, or product experience idea.",
    routingEmail: contactEmail,
  },
  {
    value: "partnership-inquiry",
    label: "Partnership inquiry",
    description: "Brand, affiliate, sponsorship, or collaboration requests.",
    routingEmail: contactEmail,
  },
  {
    value: "media-press",
    label: "Media or press inquiry",
    description: "Editorial requests, interviews, announcements, or press notes.",
    routingEmail: contactEmail,
  },
];

const contactChannelIcons = {
  contact: FaEnvelope,
  support: FaHeadphones,
};

const faqItems = [
  {
    question: "How do I report a product specification error?",
    answer:
      `Send the product page URL, the incorrect detail, and the corrected value to ${supportContactEmail} or through the form. That gives us enough context to verify the change quickly.`,
  },
  {
    question: "Where does TryHook get product information from?",
    answer:
      "We compile structured product details from public product materials, launch coverage, and manufacturer-facing information, then review listings when issues are reported.",
  },
  {
    question: "Can I request a product or category to be added?",
    answer:
      "Yes. Use the form to share the device name, brand, or category you want us to track. Requests with clear model names are much easier for us to review.",
  },
  {
    question: "What should I include for partnership or press requests?",
    answer:
      `Use ${contactEmail} for partnerships, launches, press notes, or editorial leads. Include your organization name, request type, timeline, and best follow-up details.`,
  },
];

const initialFormState = {
  fullName: "",
  email: "",
  subject: subjectOptions[0].value,
  message: "",
  agreed: false,
};

const fieldClassName =
  "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";

const SupportIllustration = () => {
  return (
    <div className="relative mx-auto w-full max-w-[500px] bg-white">
      <div className="flex items-center justify-between pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            TryHook inbox
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            Message routing
          </p>
        </div>
        <span className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-blue-700">
          Online
        </span>
      </div>

      <div className="mt-5 grid gap-3">
        {[
          {
            icon: FaEnvelope,
            title: "Contact",
            text: "General questions, editorial leads, and partnership notes.",
          },
          {
            icon: FaHeadphones,
            title: "Support",
            text: "Product corrections, page issues, and help using TryHook.",
          },
          {
            icon: FaCommentDots,
            title: "Feedback",
            text: "Suggestions that help us improve discovery and comparison.",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FeedbackIllustration = () => {
  return (
    <div className="bg-white">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
          <FaPaperPlane className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
            Feedback loop
          </p>
          <p className="mt-1 text-lg font-black text-slate-950">
            Helpful details make replies faster.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Page URL", "Exact issue", "Best email"].map((item) => (
          <div
            key={item}
            className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

const Contact = () => {
  useTitle({ page: "Contact" });

  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false);
  const subjectMenuRef = useRef(null);

  const canonical = "https://tryhook.shop/contact";
  const contactSchema = createContactPageSchema({
    name: "Contact TryHook",
    description:
      "Get in touch with TryHook through verified inboxes for general contact and support.",
    url: canonical,
    contactEmail,
    contactPoints: contactPageChannels.map((channel) => ({
      contactType: channel.contactType,
      email: channel.email,
    })),
  });
  const selectedSubjectOption =
    subjectOptions.find((option) => option.value === formState.subject) ||
    subjectOptions[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        subjectMenuRef.current &&
        !subjectMenuRef.current.contains(event.target)
      ) {
        setIsSubjectMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!isSubjectMenuOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsSubjectMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSubjectMenuOpen]);

  const handleFieldChange = (event) => {
    const { name, type, value, checked } = event.target;

    setFormState((currentState) => ({
      ...currentState,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (submitSuccess) setSubmitSuccess(false);
    if (submitError) setSubmitError("");
  };

  const handleSubjectSelect = (value) => {
    setFormState((currentState) => ({
      ...currentState,
      subject: value,
    }));
    setIsSubjectMenuOpen(false);

    if (submitSuccess) setSubmitSuccess(false);
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError("");

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formState.fullName,
          email: formState.email,
          subject: formState.subject,
          subject_label: selectedSubjectOption.label,
          routing_email: selectedSubjectOption.routingEmail,
          message: formState.message,
          agree_terms: Boolean(formState.agreed),
          source: "tryhook-web-contact",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Unable to send your message right now.",
        );
      }

      setFormState({ ...initialFormState });
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(
        error?.message ||
          "Unable to send your message right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact TryHook - Support, Feedback, and Inquiries"
        description="Contact TryHook for general questions, product corrections, platform support, feedback, partnerships, and editorial inquiries."
        url={canonical}
        robots="index, follow"
        ogType="website"
        schema={contactSchema}
      />

      <main className="min-h-screen bg-white text-slate-900">
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8 lg:pb-10 lg:pt-12">
          <div className="relative isolate bg-white py-2 sm:py-4">
            <div className="relative">
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-2 text-sm text-slate-500"
              >
                <Link
                  to="/"
                  className="transition-colors duration-200 hover:text-slate-900"
                >
                  Home
                </Link>
                <span className="text-slate-300">/</span>
                <span className="font-medium text-slate-700">Contact Us</span>
              </nav>

              <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                    Contact us
                  </p>
                  <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                    Contact TryHook
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                    Have a product correction, platform question, feedback,
                    partnership idea, or editorial note? Share the details and
                    we will route your message to the right inbox.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <a
                      href="#contact-form"
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
                    >
                      Send us a message
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <div className="mt-10 grid gap-4 sm:grid-cols-3">
                    {supportPillars.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.title}
                          className="rounded-lg border border-slate-200 bg-white p-4"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h2 className="mt-4 text-base font-bold text-slate-900">
                            {item.title}
                          </h2>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {item.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <SupportIllustration />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8">
          <div className="bg-white py-4 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Official inboxes
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Contact or support, routed clearly.
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Use the general contact inbox for broad requests and the
                  support inbox for product issues, corrections, and help using
                  TryHook.
                </p>
              </div>

              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-2 rounded-md border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:border-blue-300"
              >
                Email general contact
                <FaArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {contactPageChannels.map((channel) => {
                const Icon = contactChannelIcons[channel.key] || FaEnvelope;

                return (
                  <a
                    key={channel.key}
                    href={`mailto:${channel.email}`}
                    className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 transition-colors duration-200 hover:border-blue-200"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700 transition-colors duration-200 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {channel.name}
                    </p>
                    <h3 className="mt-2 text-base font-bold leading-6 text-slate-950">
                      {channel.headline}
                    </h3>
                    <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                      {channel.summary}
                    </p>
                    <span className="mt-4 break-all text-sm font-semibold text-blue-700">
                      {channel.email}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8">
          <div
            id="contact-form"
            className="mx-auto grid max-w-6xl scroll-mt-28 gap-10 bg-white py-6 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16 lg:py-10"
          >
            <div className="lg:pt-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                Message form
              </p>
              <div className="mt-3 max-w-xl">
                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Send us a message
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  Tell us what you need and include any useful links or product
                  details. Your subject choice routes the message to the right
                  TryHook inbox.
                </p>
              </div>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                    <FaEnvelope className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Automatic routing
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      The selected subject currently routes to:
                    </p>
                    <span className="mt-1 block break-all text-sm font-semibold text-blue-700">
                      {selectedSubjectOption.routingEmail}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-blue-100 bg-white text-blue-700">
                    <FaClock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Add useful context
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      For corrections, include the page URL, incorrect detail,
                      and the information you believe is accurate.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Full name
                  <input
                    className={fieldClassName}
                    type="text"
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleFieldChange}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Email address
                  <input
                    className={fieldClassName}
                    type="email"
                    name="email"
                    value={formState.email}
                    onChange={handleFieldChange}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    required
                  />
                </label>
              </div>

              <div className="block text-sm font-semibold text-slate-700">
                <span>Subject</span>
                <div ref={subjectMenuRef} className="relative mt-2">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isSubjectMenuOpen}
                    className={`flex w-full items-center justify-between gap-4 rounded-lg border bg-white px-4 py-3.5 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                      isSubjectMenuOpen
                        ? "border-blue-500"
                        : "border-slate-300"
                    }`}
                    onClick={() =>
                      setIsSubjectMenuOpen((currentOpen) => !currentOpen)
                    }
                  >
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">
                        {selectedSubjectOption.label}
                      </span>
                      <span className="mt-1 block text-sm font-normal leading-6 text-slate-500">
                        {selectedSubjectOption.description}
                      </span>
                    </div>
                    <FaChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        isSubjectMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isSubjectMenuOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-lg border border-blue-100 bg-white py-2">
                      {subjectOptions.map((option) => {
                        const isActive = option.value === formState.subject;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            onClick={() => handleSubjectSelect(option.value)}
                            className={`flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors ${
                              isActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">
                                {option.label}
                              </p>
                              <p
                                className={`mt-1 text-sm leading-6 ${
                                  isActive
                                    ? "text-blue-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {option.description}
                              </p>
                            </div>
                            <span
                              className={`mt-1.5 inline-flex h-2.5 w-2.5 rounded-full ${
                                isActive ? "bg-blue-600" : "bg-transparent"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Message
                <textarea
                  className={`${fieldClassName} min-h-[180px] resize-y`}
                  name="message"
                  value={formState.message}
                  onChange={handleFieldChange}
                  placeholder="Tell us more about your question, issue, or suggestion..."
                  required
                />
              </label>

              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  name="agreed"
                  checked={formState.agreed}
                  onChange={handleFieldChange}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  required
                />
                <span className="leading-6">
                  I agree to the{" "}
                  <Link
                    to="/privacy-policy"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    privacy policy
                  </Link>{" "}
                  and confirm these details are accurate.
                </span>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <FaPaperPlane className="h-3.5 w-3.5" />
                  {isSubmitting ? "Sending..." : "Send message"}
                </button>

                <p className="text-sm text-slate-500">
                  We review every relevant message.
                </p>
              </div>

              {submitSuccess ? (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <FaCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    Your message has been sent to the TryHook team. We&apos;ll
                    review it and reply to your email when needed.
                  </span>
                </div>
              ) : null}

              {submitError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {submitError} You can also reach us at{" "}
                  <a
                    href={`mailto:${contactEmail}`}
                    className="font-semibold underline decoration-red-300 underline-offset-4"
                  >
                    {contactEmail}
                  </a>
                  .
                </div>
              ) : null}
            </form>
          </div>
        </section>

        <section
          id="contact-faqs"
          className="mx-auto max-w-7xl scroll-mt-28 px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8"
        >
          <div className="bg-white py-6 sm:py-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Frequently asked questions
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  A few common questions before you send a message.
                </p>
              </div>

              <a
                href="#contact-form"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors duration-200 hover:text-blue-700"
              >
                Jump to form
                <FaArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-8 space-y-3 bg-white">
              {faqItems.map((item, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <div
                    key={item.question}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-1 sm:px-6"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 py-5 text-left"
                      onClick={() =>
                        setOpenFaqIndex((currentIndex) =>
                          currentIndex === index ? null : index,
                        )
                      }
                      aria-expanded={isOpen}
                    >
                      <span className="text-base font-semibold text-slate-900">
                        {item.question}
                      </span>
                      <FaChevronDown
                        className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen ? (
                      <div className="pb-5 pr-8 text-sm leading-7 text-slate-600">
                        {item.answer}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
          <div className="bg-white py-6 sm:py-8 lg:py-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
                  Feedback
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  We value your feedback.
                </h2>
                <p className="mt-4 text-base leading-8 text-slate-600">
                  Your feedback helps us improve product pages, fix confusing
                  details, and build better comparison tools for smarter buying
                  decisions.
                </p>
                <a
                  href="#contact-form"
                  className="mt-8 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition-colors duration-200 hover:border-blue-300"
                >
                  Share feedback in the form
                  <FaArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>

              <FeedbackIllustration />
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Contact;
