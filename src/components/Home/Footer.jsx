import React from "react";
import { Link } from "react-router-dom";
import {
  FaBalanceScale,
  FaCheckCircle,
  FaEnvelope,
  FaShieldAlt,
} from "react-icons/fa";
import { toCanonicalPagePath } from "../../utils/publicUrl";
import HookLogo from "../ui/HookLogo";

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
      {
        label: "Phones under ₹15,000",
        href: "/smartphones/filter/under-15000",
      },
      {
        label: "Phones under ₹25,000",
        href: "/smartphones/filter/under-25000",
      },
      { label: "5G smartphones", href: "/smartphones/feature/5g" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { label: "Latest tech news", href: "/news" },
      { label: "Product launches", href: "/news" },
      { label: "Buying context", href: "/news" },
      { label: "About Hooks", href: "/about" },
      { label: "Careers", href: "/careers" },
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

const Footer = () => (
  <footer className="hooks-footer text-slate-300">
    <div className="relative z-10 mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_2fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 text-white">
            <HookLogo
              aria-label="Hooks"
              className="h-12 w-12 shrink-0 rounded-2xl object-cover shadow-[0_14px_34px_rgba(37,99,235,.34)]"
            />
            <span>
              <strong className="block font-[Space_Grotesk] text-2xl font-bold tracking-[-0.04em] text-white">
                Hooks
              </strong>
              <small className="block text-xs font-semibold uppercase tracking-[0.16em] text-blue-200/70">
                Research smarter
              </small>
              <b className="block text-[11px] font-semibold text-slate-400">
                Device intelligence
              </b>
            </span>
          </Link>

          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <FaCheckCircle className="text-emerald-300" /> Structured product
              research
            </p>
            <p className="flex items-center gap-2">
              <FaShieldAlt className="text-blue-300" /> Clear editorial context
            </p>
            <p className="flex items-center gap-2">
              <FaBalanceScale className="text-violet-300" /> Practical
              comparison tools
            </p>
          </div>

          <a
            href="mailto:contact@tryhook.shop"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-blue-200"
          >
            <FaEnvelope className="text-blue-300" />
            contact@tryhook.shop
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {footerSections.map((section) => (
            <section key={section.title}>
              <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
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

      <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} Hooks. Product information may change;
          verify important details before purchase.
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

export default Footer;
