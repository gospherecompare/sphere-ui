import React from "react";
import {
  FaBriefcase,
  FaCheckCircle,
  FaEnvelope,
  FaHeadset,
  FaNewspaper,
  FaRoute,
} from "react-icons/fa";
import useTitle from "../../hooks/useTitle";
import SEO from "../SEO";
import CompanyPageShell from "../ui/CompanyPageShell";
import { createContactPageSchema } from "../../utils/schemaGenerators";
import { hookContactChannels } from "../../utils/hookContactChannels";

const SITE_ORIGIN = "https://tryhook.shop";

const iconByKey = {
  business: FaBriefcase,
  contact: FaRoute,
  news: FaNewspaper,
  support: FaHeadset,
};

const highlights = [
  {
    icon: FaCheckCircle,
    title: "Choose the right inbox",
    text: "Direct routing helps product corrections, press notes and partnerships reach the correct team.",
  },
  {
    icon: FaEnvelope,
    title: "Include useful context",
    text: "Share the affected page URL, product name and a clear description of the request.",
  },
  {
    icon: FaRoute,
    title: "One request per topic",
    text: "Keeping separate topics in separate messages makes review and follow-up easier.",
  },
];

const Contact = () => {
  useTitle({ page: "Contact Hooks" });
  const canonical = `${SITE_ORIGIN}/contact/`;
  const schema = createContactPageSchema({
    name: "Contact Hooks",
    description:
      "Contact Hooks for product data corrections, support, editorial tips, press material, business partnerships and general enquiries.",
    url: canonical,
    email: "contact@tryhook.shop",
  });

  return (
    <>
      <SEO
        title="Contact Hooks | Support, Corrections, News and Partnerships"
        description="Contact the right Hooks team for product data corrections, website support, editorial tips, press material, partnerships and general enquiries."
        url={canonical}
        schema={schema}
      />

      <CompanyPageShell
        eyebrow="Contact Hooks"
        title="Send your message to the right team."
        intro="Whether you found incorrect product data, have a technology story, need platform help or want to discuss a partnership, use the channel that best matches your request."
        icon={FaEnvelope}
        highlights={highlights}
        sections={[]}
        contactLabel="Email general enquiries"
        contactTo="mailto:contact@tryhook.shop"
      >
        <section className="hooks-contact-grid" aria-label="Hooks contact channels">
          {hookContactChannels.map((channel) => {
            const Icon = iconByKey[channel.key] || FaEnvelope;
            return (
              <article key={channel.key} className="hooks-contact-card">
                <div className="hooks-contact-card__icon"><Icon aria-hidden="true" /></div>
                <p className="hooks-eyebrow">{channel.name}</p>
                <h2>{channel.headline}</h2>
                <p>{channel.summary}</p>
                <div className="hooks-contact-card__help">
                  <strong>Helpful details to include</strong>
                  <ul>
                    {channel.key === "support" ? (
                      <>
                        <li>Page URL and product name</li>
                        <li>Incorrect value or broken behaviour</li>
                        <li>Source or screenshot when available</li>
                      </>
                    ) : channel.key === "news" ? (
                      <>
                        <li>Embargo or publication timing</li>
                        <li>Official source and media assets</li>
                        <li>Relevant market or product category</li>
                      </>
                    ) : channel.key === "business" ? (
                      <>
                        <li>Organisation and proposed collaboration</li>
                        <li>Expected audience or campaign scope</li>
                        <li>Timeline and primary contact</li>
                      </>
                    ) : (
                      <>
                        <li>A clear subject line</li>
                        <li>Relevant page or product link</li>
                        <li>The outcome you are requesting</li>
                      </>
                    )}
                  </ul>
                </div>
                <a href={`mailto:${channel.email}`} className="hooks-contact-card__email">
                  <FaEnvelope aria-hidden="true" />
                  {channel.email}
                </a>
              </article>
            );
          })}
        </section>

        <section className="hooks-response-note">
          <h2>Before sending a correction</h2>
          <p>
            Product specifications can vary by region, storage variant and software version. Please include the manufacturer or retailer source that supports the correction so the team can verify it efficiently.
          </p>
        </section>
      </CompanyPageShell>
    </>
  );
};

export default Contact;
