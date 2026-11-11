import React from "react";

import {
  FaBalanceScale,
  FaChartLine,
  FaCheckCircle,
  FaCompass,
  FaNewspaper,
  FaShieldAlt,
} from "react-icons/fa";

import SEO from "../SEO";
import CompanyPageShell from "../ui/CompanyPageShell";
import InternalLinkHub from "../ui/InternalLinkHub";
import { createAboutPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://mobilesx.in";

const highlights = [
  {
    icon: FaCompass,
    title: "Discover with purpose",
    text: "Find smartphones by brand, budget, feature, release status and real research intent instead of browsing endless lists.",
  },
  {
    icon: FaBalanceScale,
    title: "Compare what matters",
    text: "Compare specifications side by side while highlighting the differences that actually affect everyday use.",
  },
  {
    icon: FaNewspaper,
    title: "Connect products with context",
    text: "Product information, launches, updates and technology coverage are connected so research does not stop at specifications.",
  },
];

const sections = [
  {
    id: "why-mobilesx",
    title: "Why MobilesX exists",
    description:
      "Choosing a device should be a research process, not a tab-collecting exercise.",
    paragraphs: [
      "Modern smartphones come with more specifications than ever, but more specifications do not automatically make a decision easier. What matters is understanding which differences are meaningful and how they affect the experience.",
      "MobilesX brings product discovery, specifications, comparisons, pricing context and technology coverage into one connected experience. The goal is simple: help people move from a search to a confident decision with less friction.",
    ],
  },

  {
    id: "how-mobilesx-works",
    title: "How MobilesX helps",
    description:
      "The platform is designed around the way people actually research smartphones.",
    paragraphs: [
      "A visitor can discover a device, understand its key strengths, inspect detailed specifications, compare alternatives and continue into related coverage without restarting the research journey.",
    ],
    bullets: [
      "Discover smartphones by brand, budget, feature and release status",
      "Compare devices with difference-focused presentation",
      "Review specifications, variants, pricing signals and important details",
      "Explore alternatives, popular comparisons and related mobile coverage",
    ],
  },

  {
    id: "editorial-standards",
    title: "Our editorial standards",
    description: "Clarity, attribution and context come before hype.",
    paragraphs: [
      "MobilesX aims to distinguish confirmed information from early reports, manufacturer claims from practical interpretation and editorial context from raw product data.",
      "When information changes, affected pages should be updated and corrections should remain easy for readers to report.",
    ],
    bullets: [
      "Use clear language instead of unnecessary technical jargon",
      "Attribute reporting and avoid presenting rumours as confirmed facts",
      "Provide relevant dates and update context when information changes",
      "Keep commercial information separate from editorial conclusions",
    ],
  },

  {
    id: "data-accuracy",
    title: "Product data and accuracy",
    description: "Specifications are useful only when their context is clear.",
    paragraphs: [
      "Specifications, prices and availability may vary by region, configuration, retailer and software version. MobilesX organises this information for research, but important purchase details should always be verified with the manufacturer or retailer.",
      "Readers can report incorrect specifications, outdated information or broken links through the contact page. These reports help improve the quality of the platform.",
    ],
    bullets: [
      "Regional and variant differences are treated as important context",
      "Important specifications should be traceable to reliable sources",
      "Outdated information should be corrected when identified",
      "Critical purchase details should be independently verified",
    ],
  },

  {
    id: "future",
    title: "Where MobilesX is going",
    description:
      "Build a better decision system, not simply a larger catalogue.",
    paragraphs: [
      "MobilesX is evolving toward stronger comparison explanations, clearer recommendation signals, more transparent product timelines and deeper connections between product research and editorial coverage.",
      "The long-term objective is to help every visitor understand what a device offers, why it may fit their needs and which trade-offs they are accepting.",
    ],
  },
];

const About = () => {
  const canonical = `${SITE_ORIGIN}/about/`;

  const schema = createAboutPageSchema({
    name: "About MobilesX",
    description:
      "Learn how MobilesX connects smartphone discovery, comparisons, specifications, pricing context and technology reporting to help people make clearer mobile buying decisions.",
    url: canonical,
    organizationName: "MobilesX",
  });

  return (
    <>
      <SEO
        title="About MobilesX | Technology Research and Comparisons"
        description="Learn how MobilesX helps people discover smartphones, compare specifications, understand trade-offs and follow relevant mobile technology news."
        url={canonical}
        schema={schema}
      />

      <CompanyPageShell
        eyebrow="About MobilesX"
        title="A clearer way to research your next smartphone."
        intro="MobilesX is a smartphone research and technology publishing platform built to turn complex specifications into useful decisions."
        icon={FaChartLine}
        highlights={highlights}
        sections={sections}
      />

      <InternalLinkHub compact />
    </>
  );
};

export default About;
