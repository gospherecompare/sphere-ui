import React from "react";

import {
  FaBalanceScale,
  FaCheckCircle,
  FaFileContract,
  FaInfoCircle,
  FaShieldAlt,
  FaTags,
} from "react-icons/fa";

import SEO from "../SEO";
import CompanyPageShell from "../ui/CompanyPageShell";
import { createWebPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://mobilesx.in";

const CONTACT_EMAIL = "contact@mobilesx.in";

const EFFECTIVE_DATE = "August 1, 2026";

const highlights = [
  {
    icon: FaInfoCircle,
    title: "Information, not professional advice",
    text: "MobilesX supports technology research but does not replace manufacturer, retailer or professional guidance.",
  },

  {
    icon: FaTags,
    title: "Prices and specifications change",
    text: "Users should verify critical details, availability and final pricing before purchase.",
  },

  {
    icon: FaShieldAlt,
    title: "Responsible use required",
    text: "Access must remain lawful, non-disruptive and consistent with these terms.",
  },
];

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",

    paragraphs: [
      "By accessing or using MobilesX, you agree to these Terms and Conditions and the Privacy Policy. If you do not agree, do not use the platform.",

      "MobilesX may update these terms as features, business practices or legal requirements change. Continued use after an updated version is published means you accept the revised terms.",
    ],
  },

  {
    id: "platform-purpose",
    title: "Platform purpose",

    paragraphs: [
      "MobilesX provides smartphone discovery, product specifications, comparison tools, pricing signals, editorial reporting and related information for general informational and educational purposes.",

      "Content is not legal, financial, medical, investment or other professional advice. Product recommendations and editorial opinions reflect the information and judgment available at the time of publication.",
    ],
  },

  {
    id: "accuracy",
    title: "Product information, pricing and accuracy",

    paragraphs: [
      "MobilesX works to present useful information, but specifications, images, launch dates, software features, variants, prices, offers and availability may be incomplete, delayed or different across markets and retailers.",

      "Before purchasing, users should verify important details directly with the manufacturer, authorised seller or service provider. MobilesX is not the seller of products displayed on the platform unless a page expressly states otherwise.",
    ],
  },

  {
    id: "permitted-use",
    title: "Permitted use",

    bullets: [
      "Use MobilesX for lawful personal research, comparison and reading",

      "Share links to public pages and quote limited excerpts with clear attribution",

      "Submit corrections, support requests and editorial information in good faith",

      "Respect technical limits, access controls and intellectual-property rights",
    ],
  },

  {
    id: "prohibited-use",
    title: "Prohibited use",

    bullets: [
      "Attempting unauthorised access to accounts, systems, APIs or infrastructure",

      "Large-scale scraping, copying or redistribution that bypasses published access controls",

      "Introducing malicious code, automated abuse, spam or disruptive traffic",

      "Misrepresenting affiliation with MobilesX or using MobilesX branding without permission",

      "Using the platform to violate law, privacy, intellectual-property or third-party rights",
    ],
  },

  {
    id: "third-party-services",
    title: "Retailers, affiliate links and third-party services",

    paragraphs: [
      "MobilesX may link to retailers, manufacturers, advertisers, analytics providers and other external services. Their content, pricing, availability, security and policies are controlled by those third parties.",

      "Some outbound links may be affiliate links, which can allow MobilesX to earn a commission without changing the price paid by the user. Commercial relationships do not guarantee that a product is suitable for every user.",
    ],
  },

  {
    id: "intellectual-property",
    title: "Content and intellectual property",

    paragraphs: [
      "MobilesX and its licensors retain rights in original text, design, branding, databases, software and platform features. Manufacturer names, trademarks and product imagery belong to their respective owners.",

      "Except where law permits, users may not reproduce, republish, sell, modify or commercially exploit substantial portions of the platform without written permission.",
    ],
  },

  {
    id: "user-submissions",
    title: "Corrections, messages and other submissions",

    paragraphs: [
      "When you submit a correction, tip, message or other material, you confirm that you have the right to share it and that it does not unlawfully infringe another person's rights. Do not submit confidential or sensitive material through general contact channels.",

      "MobilesX may use submitted information to review the request, correct content, respond to you and improve the platform. Publication of any submission is at the discretion of MobilesX.",
    ],
  },

  {
    id: "availability",
    title: "Availability and changes to the service",

    paragraphs: [
      "MobilesX may change, suspend or discontinue features, routes, data sources or content without guaranteeing continuous availability. Maintenance, provider outages, security events and technical failures may affect access.",
    ],
  },

  {
    id: "disclaimers",
    title: "Disclaimers and limitation of liability",

    paragraphs: [
      "To the extent permitted by applicable law, MobilesX is provided on an “as available” basis without warranties that every page will be uninterrupted, error-free or fully current.",

      "MobilesX and its contributors are not responsible for indirect or consequential losses arising from reliance on platform content, third-party services, purchase decisions, unavailable features or unauthorised access outside reasonable control. Nothing in these terms excludes liability that cannot legally be excluded.",
    ],
  },

  {
    id: "governing-law",
    title: "Governing law and disputes",

    paragraphs: [
      "These terms are governed by the laws applicable to the entity operating MobilesX, subject to any mandatory consumer rights in the user's jurisdiction. Parties should first attempt to resolve concerns by contacting MobilesX before pursuing formal remedies.",
    ],
  },

  {
    id: "contact",
    title: "Contact about these terms",

    paragraphs: [
      `Questions about these terms can be sent to ${CONTACT_EMAIL}. These website terms are general operational text and should be reviewed by qualified legal counsel for the specific business entity, services and jurisdictions in which MobilesX operates.`,
    ],
  },
];

const Terms = () => {
  const canonical = `${SITE_ORIGIN}/terms/`;

  const schema = createWebPageSchema({
    name: "MobilesX Terms and Conditions",
    description:
      "Terms governing use of the MobilesX smartphone discovery, product comparison and editorial platform.",
    url: canonical,
  });

  return (
    <>
      <SEO
        title="Terms and Conditions | MobilesX"
        description="Read the MobilesX terms covering smartphone information, responsible use, third-party links, affiliate disclosures and service limitations."
        url={canonical}
        schema={schema}
      />

      <CompanyPageShell
        eyebrow="Terms and Conditions"
        title="The rules for using MobilesX."
        intro="These terms explain how the platform may be used, the limits of product and editorial information, and the responsibilities that apply to users and MobilesX."
        updated={EFFECTIVE_DATE}
        icon={FaFileContract}
        highlights={highlights}
        sections={sections}
      />
    </>
  );
};

export default Terms;
