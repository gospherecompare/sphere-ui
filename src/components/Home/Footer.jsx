// src/components/Footer.jsx
import React from "react";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaChevronRight,
  FaMobileAlt,
  FaLaptop,
  FaTv,
  FaInfoCircle,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { toCanonicalPagePath } from "../../utils/publicUrl";

const footerSections = [
  {
    title: "Smartphones",
    icon: FaMobileAlt,
    links: [
      { label: "All Smartphones", href: "/smartphones" },
      { label: "Trending Smartphones", href: "/trending/smartphones" },
      { label: "New Launches", href: "/smartphones/filter/new" },
      { label: "Compare Smartphones", href: "/compare" },
    ],
  },
  {
    title: "Laptops",
    icon: FaLaptop,
    links: [
      { label: "All Laptops", href: "/laptops" },
      { label: "Trending Laptops", href: "/trending/laptops" },
      { label: "New Launches", href: "/laptops?filter=new" },
      { label: "Compare Laptops", href: "/compare" },
    ],
  },
  {
    title: "TVs",
    icon: FaTv,
    links: [
      { label: "All TVs", href: "/tvs" },
      { label: "Trending TVs", href: "/trending/tvs" },
      { label: "New Launches", href: "/tvs?filter=new" },
      { label: "Compare TVs", href: "/compare" },
    ],
  },
  {
    title: "Quick Links",
    icon: FaInfoCircle,
    links: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Compare Devices", href: "/compare" },
    ],
  },
];

const socialLinks = [
  {
    icon: FaFacebook,
    label: "Facebook",
    url: "https://facebook.com",
  },
  { icon: FaTwitter, label: "Twitter", url: "https://twitter.com" },
  {
    icon: FaInstagram,
    label: "Instagram",
    url: "https://instagram.com",
  },
  {
    icon: FaLinkedin,
    label: "LinkedIn",
    url: "https://linkedin.com",
  },
  { icon: FaYoutube, label: "YouTube", url: "https://youtube.com" },
];

const FooterSectionCard = ({ section }) => {
  const Icon = section.icon;

  return (
    <div className="  p-5 ">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-cyan-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
          {section.title}
        </h3>
      </div>
      <ul className="mt-4 space-y-2">
        {section.links.map((link) => (
          <li
            key={link.label}
            className={link.hideOnMobile ? "hidden sm:list-item" : ""}
          >
            <Link
              to={toCanonicalPagePath(link.href)}
              className="group inline-flex items-center gap-2 text-sm text-sky-100/75 transition-colors duration-200 hover:text-white"
            >
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="border-t border-sky-900/60 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-4">
          {footerSections.map((section) => (
            <FooterSectionCard key={section.title} section={section} />
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">
                Hooks
              </p>
              <p className="mt-2 max-w-2xl text-sm text-sky-100/70">
                Compare smarter. Discover faster.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sky-100/70 transition-colors duration-200 hover:border-cyan-300/40 hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <social.icon className="text-base" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="text-xs text-sky-100/55 sm:text-sm">
            &copy; {new Date().getFullYear()} Hooks. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-sky-100/55 sm:text-sm">
            <Link
              to="/privacy-policy"
              className="transition-colors duration-200 hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="transition-colors duration-200 hover:text-white"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              to="/contact"
              className="transition-colors duration-200 hover:text-white"
            >
              Contact
            </Link>
            <Link
              to="/careers"
              className="transition-colors duration-200 hover:text-white"
            >
              Careers
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
