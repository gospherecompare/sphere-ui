import { useState } from "react";
import {
  FaBolt,
  FaChevronDown,
  FaEnvelope,
  FaNewspaper,
  FaRss,
  FaTag,
  FaYoutube,
} from "react-icons/fa";
import { FaInstagram, FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../utils/apiUrl";
import { toCanonicalPagePath } from "../../utils/publicUrl";
import MobilesXLogo from "../ui/MobileX";
import "./footer.css";

const footerSections = [
  {
    title: "Discover",
    links: [
      { label: "All smartphones", href: "/smartphones" },
      { label: "Latest smartphones", href: "/smartphones/filter/new" },
      { label: "Upcoming smartphones", href: "/smartphones/upcoming" },
      { label: "TV buying discovery", href: "/tvs" },
      { label: "Trending technology", href: "/trending/smartphones" },
    ],
  },
  {
    title: "Research",
    links: [
      { label: "Compare devices", href: "/compare" },
      { label: "Popular comparisons", href: "/popular-comparisons" },
      { label: "Phones under ₹15,000", href: "/smartphones/filter/under-15000" },
      { label: "Phones under ₹25,000", href: "/smartphones/filter/under-25000" },
      { label: "5G smartphones", href: "/smartphones/feature/5g" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { label: "Latest tech news", href: "/news" },
      { label: "Product launches", href: "/news" },
      { label: "Buying guides", href: "/news" },
      { label: "About MobilesX", href: "/about" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact the team", href: "/contact" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms and conditions", href: "/terms" },
      { label: "Report incorrect data", href: "/contact" },
      { label: "Business enquiries", href: "/contact" },
    ],
  },
];

const newsletterBenefits = [
  { label: "Launch alerts", icon: FaBolt },
  { label: "Price drops", icon: FaTag },
  { label: "Top tech news", icon: FaNewspaper },
];

const socialLinks = [
  { label: "YouTube", icon: FaYoutube, href: "https://www.youtube.com/" },
  { label: "X", icon: FaXTwitter, href: "https://x.com/" },
  { label: "Instagram", icon: FaInstagram, href: "https://www.instagram.com/" },
  { label: "RSS feed", icon: FaRss, href: "/news" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const handleNewsletterSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage("");
    setMessageIsError(false);
    try {
      const response = await fetch(buildApiUrl("/email-updates/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Could not subscribe right now.");
      }

      setEmail("");
      setMessage("Thanks! This address is subscribed to MobilesX updates.");
    } catch (error) {
      setMessage(error.message || "Could not subscribe right now.");
      setMessageIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="hooks-footer mx-site-footer">
      <div className="mx-site-footer__inner">
        <section className="mx-footer-newsletter" aria-labelledby="mx-footer-newsletter-title">
          <div className="mx-footer-newsletter__copy">
            <h2 id="mx-footer-newsletter-title">
              Get the latest from <span>MobilesX</span>
            </h2>
            <p>Smartphone launches, tech news, deals and price drops — delivered to your inbox.</p>
            <ul className="mx-footer-newsletter__benefits" aria-label="Newsletter topics">
              {newsletterBenefits.map(({ label, icon: Icon }) => (
                <li key={label}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <form className="mx-footer-newsletter__form" onSubmit={handleNewsletterSubmit}>
            <label className="sr-only" htmlFor="footer-newsletter-email">
              Email address
            </label>
            <div className="mx-footer-newsletter__email">
              <FaEnvelope aria-hidden="true" />
              <input
                id="footer-newsletter-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email address"
              />
            </div>
            <button type="submit" disabled={submitting}>
              {submitting ? "Subscribing..." : "Subscribe"}
            </button>
            {message && (
              <p
                className={`mx-footer-newsletter__message${messageIsError ? " is-error" : ""}`}
                role={messageIsError ? "alert" : "status"}
                aria-live="polite"
              >
                {message}
              </p>
            )}
          </form>
        </section>

        <div className="mx-footer-main">
          <div className="mx-footer-brand">
            <Link to="/" className="mx-footer-brand__logo" aria-label="MobilesX home">
              <MobilesXLogo darkBackground={false} />
            </Link>
            <p>MobilesX is your destination for smartphones, TVs and the latest consumer technology.</p>
            <nav className="mx-footer-social" aria-label="Social media">
              {socialLinks.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  target={href.startsWith("https://") ? "_blank" : undefined}
                  rel={href.startsWith("https://") ? "noreferrer" : undefined}
                >
                  <Icon aria-hidden="true" />
                </a>
              ))}
            </nav>
          </div>

          <nav className="mx-footer-navigation" aria-label="Footer navigation">
            {footerSections.map((section) => {
              const sectionId = `mx-footer-${section.title.toLowerCase()}`;
              const isOpen = openSection === section.title;

              return (
                <section className="mx-footer-link-group" key={section.title}>
                  <h3>{section.title}</h3>
                  <button
                    type="button"
                    className="mx-footer-link-group__toggle"
                    aria-expanded={isOpen}
                    aria-controls={sectionId}
                    onClick={() => setOpenSection(isOpen ? null : section.title)}
                  >
                    <span>{section.title}</span>
                    <FaChevronDown aria-hidden="true" />
                  </button>
                  <ul id={sectionId} className={isOpen ? "is-open" : ""}>
                    {section.links.map((link) => (
                      <li key={`${section.title}-${link.label}`}>
                        <Link to={toCanonicalPagePath(link.href)}>{link.label}</Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </nav>
        </div>

        <div className="mx-footer-bottom">
          <p>
            © {new Date().getFullYear()} MobilesX. Product information may change; verify important details before purchase.
          </p>
          <nav aria-label="Legal links">
            <Link to="/privacy-policy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Corrections &amp; support</Link>
          </nav>
        </div>
      </div>
      <div className="mx-footer-waves" aria-hidden="true" />
    </footer>
  );
};

export default Footer;
