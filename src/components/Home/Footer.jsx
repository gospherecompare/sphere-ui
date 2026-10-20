import { useState } from "react";
import {
  FaBalanceScale,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../utils/apiUrl";
import { toCanonicalPagePath } from "../../utils/publicUrl";
import MobilesXLogo from "../ui/MobileX";

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
      { label: "Phones under INR 15,000", href: "/smartphones/filter/under-15000" },
      { label: "Phones under INR 25,000", href: "/smartphones/filter/under-25000" },
      { label: "5G smartphones", href: "/smartphones/feature/5g" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { label: "Latest tech news", href: "/news" },
      { label: "Product launches", href: "/news" },
      { label: "Buying context", href: "/news" },
      { label: "About MobilesX", href: "/about" },
    ],
  },
  {
    title: "Trust & support",
    links: [
      { label: "Contact the team", href: "/contact" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Terms and conditions", href: "/terms" },
      { label: "Report incorrect data", href: "/contact" },
      { label: "Business enquiries", href: "/contact" },
    ],
  },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

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
    <footer className="hooks-footer text-slate-300">
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <section className="grid gap-5 pb-8 md:grid-cols-[minmax(0,0.8fr)_minmax(320px,1.2fr)] md:items-center md:gap-8 md:pb-9 lg:grid-cols-[minmax(220px,0.8fr)_minmax(320px,1.2fr)]">
          <div>
            <h2 className="text-lg font-bold text-white sm:text-xl">
              Subscribe to MobilesX updates
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-400">
              Product launches, technology news, and price drops.
            </p>
          </div>

          <form onSubmit={handleNewsletterSubmit} className="w-full md:max-w-[540px] lg:justify-self-center">
            <label className="sr-only" htmlFor="footer-newsletter-email">
              Email address
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
                className="h-10 min-w-0 flex-1 border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-10 shrink-0 bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
            {message && (
              <p
                className={`mt-2 text-sm ${messageIsError ? "text-rose-300" : "text-emerald-300"}`}
                role={messageIsError ? "alert" : "status"}
                aria-live="polite"
              >
                {message}
              </p>
            )}
          </form>

        </section>

        <div className="grid gap-10 py-9 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,2.5fr)] lg:py-10">
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-white no-underline"
              aria-label="MobilesX home"
            >
              <MobilesXLogo className="h-[26px] w-auto sm:h-[30px] md:h-[34px]" />
            </Link>
            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <FaCheckCircle className="text-emerald-300" />
                Structured product research
              </p>
              <p className="flex items-center gap-2">
                <FaShieldAlt className="text-blue-300" />
                Clear editorial context
              </p>
              <p className="flex items-center gap-2">
                <FaBalanceScale className="text-violet-300" />
                Practical comparison tools
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
            {footerSections.map((section) => (
              <section key={section.title}>
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.label}`}>
                      <Link
                        to={toCanonicalPagePath(link.href)}
                        className="text-sm leading-6 text-slate-400 transition hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} MobilesX. Product information may
            change; verify important details before purchase.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy-policy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link to="/contact" className="transition hover:text-white">
              Corrections & support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
