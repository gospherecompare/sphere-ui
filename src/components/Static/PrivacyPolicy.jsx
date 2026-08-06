import React from "react";
import {
  FaCookieBite,
  FaDatabase,
  FaEye,
  FaLock,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import CompanyPageShell from "../ui/CompanyPageShell";
import { createWebPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://tryhook.shop";
const EFFECTIVE_DATE = "August 1, 2026";

const highlights = [
  {
    icon: FaEye,
    title: "Clear purpose",
    text: "Information is used to operate, secure and improve the Hooks experience.",
  },
  {
    icon: FaLock,
    title: "Reasonable safeguards",
    text: "Administrative and technical measures are used to protect information handled by the platform.",
  },
  {
    icon: FaUserCheck,
    title: "Choices and requests",
    text: "Users can contact Hooks about privacy questions, corrections or deletion requests where applicable.",
  },
];

const sections = [
  {
    id: "scope",
    title: "Scope of this policy",
    paragraphs: [
      "This Privacy Policy explains how Hooks handles information when you visit tryhook.shop, use product discovery and comparison features, read editorial content, submit a contact request or interact with related services.",
      "This policy applies to information handled by Hooks. Third-party retailers, analytics providers, advertising platforms and external websites operate under their own privacy policies.",
    ],
  },
  {
    id: "information-collected",
    title: "Information we may collect",
    description: "The information available to Hooks depends on how you use the platform.",
    bullets: [
      "Information you provide directly, such as your name, email address and message when contacting the team",
      "Technical information such as browser type, device type, operating system, approximate region, referring page and IP-related security signals",
      "Usage information such as pages viewed, searches, comparison interactions, clicks and session timing",
      "Notification preferences and permission status when you choose to enable browser or app notifications",
      "Diagnostic information used to detect errors, abuse, performance issues and security incidents",
    ],
  },
  {
    id: "how-information-is-used",
    title: "How information may be used",
    bullets: [
      "Provide and maintain product discovery, comparison, news and support features",
      "Respond to enquiries, corrections, editorial tips and business requests",
      "Improve search relevance, navigation, page performance and product data quality",
      "Measure aggregated engagement and understand which content is useful",
      "Protect the platform against spam, fraud, misuse and technical threats",
      "Comply with valid legal obligations and enforce platform terms",
    ],
  },
  {
    id: "cookies-and-measurement",
    title: "Cookies, analytics and similar technologies",
    paragraphs: [
      "Hooks may use cookies, local storage, analytics tools and similar technologies to remember preferences, understand usage, measure performance and support advertising or affiliate attribution. Some technologies may be provided by third parties.",
      "You can control many cookies through your browser settings. Blocking some technologies may affect preferences, analytics, notifications or parts of the site experience.",
    ],
  },
  {
    id: "sharing",
    title: "When information may be shared",
    paragraphs: [
      "Hooks does not sell personal information as a standalone data product. Information may be shared with service providers that support hosting, analytics, communications, security, advertising, affiliate measurement or other platform operations, subject to appropriate contractual or technical controls where applicable.",
      "Information may also be disclosed when required by law, necessary to protect rights or safety, or connected with a legitimate business reorganisation, acquisition or transfer of assets.",
    ],
  },
  {
    id: "retention-and-security",
    title: "Retention and security",
    paragraphs: [
      "Information is retained only for as long as reasonably necessary for the purposes described in this policy, including support, security, analytics, dispute resolution and legal requirements. Retention periods can vary by information type and service provider.",
      "No online system can guarantee absolute security. Hooks uses reasonable safeguards, but users should avoid sending sensitive personal, financial or authentication information through general contact channels.",
    ],
  },
  {
    id: "your-choices",
    title: "Your choices and privacy requests",
    bullets: [
      "Adjust cookies and site data through your browser settings",
      "Disable notifications through browser or device settings",
      "Request correction or deletion of information you submitted, where applicable",
      "Ask how a privacy request will be verified and processed",
      "Contact Hooks with questions about this policy or the handling of your information",
    ],
  },
  {
    id: "children",
    title: "Children's privacy",
    paragraphs: [
      "Hooks is a general-audience technology platform and is not designed to knowingly collect personal information from children below the age required for independent consent in their jurisdiction. A parent or guardian who believes a child provided personal information may contact Hooks for review.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "This policy may be updated as the platform, service providers or legal requirements change. The effective date at the top of the page will be revised when material changes are published.",
    ],
  },
  {
    id: "contact",
    title: "Privacy contact",
    paragraphs: [
      "Privacy questions and requests can be sent to contact@tryhook.shop. Include enough information to understand the request, but do not send passwords, payment details or government identification unless specifically required through a secure process.",
    ],
  },
];

const PrivacyPolicy = () => {
  useTitle({ page: "Privacy Policy" });
  const canonical = `${SITE_ORIGIN}/privacy-policy/`;
  const schema = createWebPageSchema({
    name: "Hooks Privacy Policy",
    description:
      "Learn how Hooks may collect, use, protect and share information across its product comparison, discovery, news and support experiences.",
    url: canonical,
  });

  return (
    <>
      <SEO
        title="Privacy Policy | How Hooks Handles Information"
        description="Read the Hooks Privacy Policy covering information collection, cookies, analytics, security, retention, service providers and privacy choices."
        url={canonical}
        schema={schema}
      />
      <CompanyPageShell
        eyebrow="Privacy Policy"
        title="Privacy information in plain language."
        intro="This policy explains what information Hooks may handle, why it is used, when service providers may receive it and which choices are available to users."
        updated={EFFECTIVE_DATE}
        icon={FaShieldAlt}
        highlights={highlights}
        sections={sections}
      />
    </>
  );
};

export default PrivacyPolicy;
