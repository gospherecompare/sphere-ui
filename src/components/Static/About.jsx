import React from "react";
import {
  FaBalanceScale,
  FaChartLine,
  FaCheckCircle,
  FaCompass,
  FaNewspaper,
  FaShieldAlt,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import CompanyPageShell from "../ui/CompanyPageShell";
import InternalLinkHub from "../ui/InternalLinkHub";
import { createAboutPageSchema } from "../../utils/schemaGenerators";

const SITE_ORIGIN = "https://tryhook.shop";

const highlights = [
  {
    icon: FaCompass,
    title: "Discovery without the noise",
    text: "Useful routes by category, budget, brand, feature and real buying priority.",
  },
  {
    icon: FaBalanceScale,
    title: "Comparison with context",
    text: "Side-by-side specifications supported by clearer explanations and differences.",
  },
  {
    icon: FaNewspaper,
    title: "Products connected to news",
    text: "Launches, updates and buying context sit closer to the products they affect.",
  },
];

const sections = [
  {
    id: "why-hooks-exists",
    title: "Why Hooks exists",
    description: "Technology research should create confidence, not more tabs.",
    paragraphs: [
      "People rarely need more specifications. They need a clearer way to understand which specifications matter, how products differ and what those differences mean in everyday use.",
      "Hooks brings product discovery, detailed information, comparisons, pricing signals and technology reporting into one connected experience. The goal is simple: reduce the distance between first search and informed decision.",
    ],
  },
  {
    id: "how-we-help",
    title: "How Hooks helps people decide",
    paragraphs: [
      "Our product pages are designed to move from a quick overview to deeper research without forcing users to restart their journey. A visitor can discover a phone, understand its highlights, inspect specifications, compare alternatives and continue into related coverage.",
    ],
    bullets: [
      "Browse by category, price, brand and meaningful features",
      "Compare products side by side with difference-focused presentation",
      "Review variants, store pricing and important specification groups",
      "Follow internal links to alternatives, popular comparisons and related news",
    ],
  },
  {
    id: "editorial-principles",
    title: "Our editorial principles",
    description: "Clarity, attribution and useful context come before hype.",
    paragraphs: [
      "Hooks aims to separate confirmed information from early reports, product claims from practical interpretation and editorial judgment from raw data. When information changes, we work to update affected pages and make corrections easier to report.",
    ],
    bullets: [
      "Use plain language and explain technical terms where they matter",
      "Attribute reporting and avoid presenting rumours as confirmed facts",
      "Show dates, update context and relevant product relationships",
      "Keep commercial links distinct from editorial conclusions",
    ],
  },
  {
    id: "product-data",
    title: "Product data and accuracy",
    paragraphs: [
      "Specifications, prices and availability can change by market, retailer, variant and software update. Hooks organises information for research, but users should verify critical purchase details with the manufacturer or retailer before buying.",
      "Readers can report an incorrect specification, broken link or outdated price through the contact page. Those reports help us improve the usefulness of the platform.",
    ],
  },
  {
    id: "what-we-are-building",
    title: "What we are building next",
    description: "A connected technology decision platform, not a collection of isolated pages.",
    paragraphs: [
      "Hooks is evolving toward richer comparison explanations, stronger recommendation signals, clearer product timelines, more transparent data notes and tighter connections between product research and editorial coverage.",
      "The long-term aim is to help every visitor understand what to buy, why it fits and which trade-offs they are accepting.",
    ],
  },
];

const About = () => {
  useTitle({ page: "About Hooks" });
  const canonical = `${SITE_ORIGIN}/about/`;
  const schema = createAboutPageSchema({
    name: "About Hooks",
    description:
      "Learn how Hooks connects product discovery, comparisons, specifications, pricing signals and technology reporting to help people make clearer buying decisions.",
    url: canonical,
    organizationName: "Hooks",
  });

  return (
    <>
      <SEO
        title="About Hooks | Clearer Technology Research and Comparisons"
        description="Learn how Hooks helps people discover products, compare specifications, understand trade-offs and follow relevant technology news in one connected experience."
        url={canonical}
        schema={schema}
      />
      <CompanyPageShell
        eyebrow="About Hooks"
        title="Technology decisions, made clearer."
        intro="Hooks is a product discovery, comparison and technology publishing platform built to turn complex specifications into useful decisions."
        icon={FaChartLine}
        highlights={highlights}
        sections={sections}
      />
      <InternalLinkHub compact />
    </>
  );
};

export default About;
