import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaChartLine,
  FaMobileAlt,
  FaNewspaper,
  FaSearch,
  FaTv,
} from "react-icons/fa";
import SectionHeading from "./SectionHeading";

const links = [
  {
    title: "Find your next phone",
    copy: "Explore current models by budget, brand, display, battery and camera priorities.",
    to: "/smartphones",
    icon: FaSearch,
    art: "radial-gradient(circle at 20% 20%, rgba(37,99,235,.24), transparent 42%), linear-gradient(135deg,#eff6ff,#f8fafc)",
  },
  {
    title: "Compare devices",
    copy: "Put phones side by side and focus on the differences that change everyday use.",
    to: "/compare",
    icon: FaChartLine,
    art: "radial-gradient(circle at 80% 20%, rgba(124,58,237,.22), transparent 42%), linear-gradient(135deg,#f5f3ff,#fafafa)",
  },
  {
    title: "Latest smartphones",
    copy: "See new launches, price positioning and the models gaining attention now.",
    to: "/smartphones/filter/new",
    icon: FaMobileAlt,
    art: "radial-gradient(circle at 70% 75%, rgba(14,165,233,.22), transparent 42%), linear-gradient(135deg,#ecfeff,#f8fafc)",
  },
  {
    title: "TV buying guides",
    copy: "Understand 4K, OLED, QLED, refresh rates and the features worth paying for.",
    to: "/tvs",
    icon: FaTv,
    art: "radial-gradient(circle at 25% 75%, rgba(16,185,129,.2), transparent 42%), linear-gradient(135deg,#ecfdf5,#f8fafc)",
  },
  {
    title: "Trending technology",
    copy: "Discover products people are researching and comparing across MobilesX.",
    to: "/trending/smartphones",
    icon: FaBolt,
    art: "radial-gradient(circle at 75% 30%, rgba(245,158,11,.22), transparent 42%), linear-gradient(135deg,#fffbeb,#f8fafc)",
  },
  {
    title: "Tech news desk",
    copy: "Read concise reporting on launches, updates, deals and the stories behind products.",
    to: "/news",
    icon: FaNewspaper,
    art: "radial-gradient(circle at 20% 30%, rgba(244,63,94,.18), transparent 42%), linear-gradient(135deg,#fff1f2,#f8fafc)",
  },
];

const directoryGroups = [
  {
    title: "Discover products",
    links: [
      ["All smartphones", "/smartphones"],
      ["Latest smartphones", "/smartphones/filter/new"],
      ["Trending smartphones", "/trending/smartphones"],
      ["Smart TVs", "/tvs"],
      ["Networking", "/networking"],
    ],
  },
  {
    title: "Compare and decide",
    links: [
      ["Create a comparison", "/compare"],
      ["Popular comparisons", "/popular-comparisons"],
      ["Phones under ₹15,000", "/smartphones/filter/under-15000"],
      ["Phones under ₹25,000", "/smartphones/filter/under-25000"],
      ["Phones under ₹40,000", "/smartphones/filter/under-40000"],
    ],
  },
  {
    title: "Read and learn",
    links: [
      ["Technology news", "/news"],
      ["About MobilesX", "/about"],
      ["Contact the team", "/contact"],
      ["Privacy policy", "/privacy-policy"],
      ["Terms of use", "/terms"],
    ],
  },
];

const DirectoryVariant = () => (
  <section
    className="home-v2-research-directory"
    aria-labelledby="home-research-directory-title"
  >
    <div className="hooks-container">
      <div className="home-v2-research-directory__head">
        <div>
          <p className="home-v2-eyebrow">Research directory</p>
          <h2 id="home-research-directory-title">
            Continue exploring without starting over
          </h2>
        </div>
        <p>
          Direct internal paths to product discovery, price filters,
          comparisons, editorial coverage, and essential MobilesX information.
        </p>
      </div>
      <div className="home-v2-research-directory__grid">
        {directoryGroups.map((group, groupIndex) => (
          <div key={group.title} className="home-v2-research-directory__group">
            <span>0{groupIndex + 1}</span>
            <h3>{group.title}</h3>
            <nav aria-label={group.title}>
              {group.links.map(([label, to]) => (
                <Link key={to} to={to}>
                  {label}
                  <FaArrowRight aria-hidden="true" />
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CardVariant = ({ compact = false }) => (
  <section
    className="hooks-section hooks-link-hub"
    aria-labelledby="explore-hooks-title"
  >
    <div className="hooks-container">
      <SectionHeading
        eyebrow="Decision shortcuts"
        title="Go from browsing to a confident choice"
        description="Explore the most useful paths across MobilesX. Each destination is connected to product details, comparisons, price discovery and related editorial coverage."
      />

      <div
        className={`hooks-link-grid ${compact ? "hooks-link-grid--compact" : ""}`}
      >
        {links.map((item, index) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="hooks-link-card">
              <span
                className="hooks-link-card__art"
                style={{ background: item.art }}
              >
                <span className="hooks-link-card__index">0{index + 1}</span>
                <Icon aria-hidden="true" />
              </span>
              <span className="hooks-link-card__content">
                <strong>{item.title}</strong>
                <span>{item.copy}</span>
              </span>
              <FaArrowRight
                className="hooks-link-card__arrow"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </div>
  </section>
);

const InternalLinkHub = ({ compact = false, variant = "cards" }) =>
  variant === "directory" ? (
    <DirectoryVariant />
  ) : (
    <CardVariant compact={compact} />
  );

export default InternalLinkHub;
