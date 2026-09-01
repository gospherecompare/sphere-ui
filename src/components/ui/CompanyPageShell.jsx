import React from "react";

import { FaArrowRight, FaEnvelope } from "react-icons/fa";

import { Link } from "react-router-dom";

const CompanyPageShell = ({
  eyebrow,
  title,
  intro,
  updated,
  icon: Icon,
  highlights = [],
  sections = [],
  children,
  contactLabel = "Contact MobilesX",
  contactTo = "/contact",
}) => (
  <main className="hooks-company-page min-h-screen">
    {/* Hero */}
    <section className="hooks-company-hero">
      <div className="hooks-container">
        <div className="hooks-company-hero__grid">
          <div>
            <p className="hooks-eyebrow">{eyebrow}</p>

            <h1>{title}</h1>

            <p className="hooks-company-hero__intro">{intro}</p>

            {updated ? (
              <p className="hooks-company-hero__updated">
                Last updated: {updated}
              </p>
            ) : null}
          </div>
        </div>

        {highlights.length ? (
          <div className="hooks-company-highlights">
            {highlights.map((item) => {
              const HighlightIcon = item.icon;

              return (
                <article key={item.title}>
                  {HighlightIcon ? <HighlightIcon aria-hidden="true" /> : null}

                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>

    {/* Content */}
    <section className="hooks-company-content">
      <div
        className={`hooks-container hooks-company-content__grid ${
          sections.length ? "" : "hooks-company-content__grid--full"
        }`}
      >
        {sections.length ? (
          <aside className="hooks-company-toc" aria-label="On this page">
            <p>On this page</p>

            <nav>
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>
        ) : null}

        <div className="hooks-company-article">
          {children ||
            sections.map((section, index) => (
              <article
                id={section.id}
                key={section.id}
                className="hooks-company-section"
              >
                <div className="hooks-company-section__number">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div>
                  <h2>{section.title}</h2>

                  {section.description ? (
                    <p className="hooks-company-section__lead">
                      {section.description}
                    </p>
                  ) : null}

                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}

                  {section.bullets?.length ? (
                    <ul>
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}

                  {section.content || null}
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="hooks-company-cta">
      <div className="hooks-container">
        <div className="hooks-company-cta__card">
          <div>
            <p className="hooks-eyebrow">Need a human response?</p>

            <h2>Connect with the MobilesX team.</h2>

            <p>
              Use the contact page for product-data corrections, editorial
              notes, support questions and business enquiries.
            </p>
          </div>

          {String(contactTo).startsWith("mailto:") ||
          String(contactTo).startsWith("http") ? (
            <a href={contactTo} className="hooks-company-cta__button">
              {contactLabel}
              <FaArrowRight aria-hidden="true" />
            </a>
          ) : (
            <Link to={contactTo} className="hooks-company-cta__button">
              {contactLabel}
              <FaArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  </main>
);

export default CompanyPageShell;
