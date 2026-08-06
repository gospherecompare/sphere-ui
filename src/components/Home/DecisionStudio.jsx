import React from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaExchangeAlt,
  FaMobileAlt,
  FaNewspaper,
  FaRupeeSign,
} from "react-icons/fa";
import { useHomeData } from "./HomeDataContext";
import { formatCompact } from "./homeData";
import SmartDeviceArt from "./SmartDeviceArt";

const researchPaths = [
  {
    title: "Smartphone finder",
    copy: "Filter the live catalogue by budget, brand, camera, battery and the features you actually need.",
    to: "/smartphones",
    icon: FaMobileAlt,
    statKey: "smartphones",
    statLabel: "phones to explore",
    tone: "blue",
    artVariant: "search",
    action: "Find a phone",
  },
  {
    title: "Price-first picks",
    copy: "Choose a budget first, then see where each phone wins on performance, display and long-term value.",
    to: "/smartphones/filter/under-30000",
    icon: FaRupeeSign,
    statValue: "₹30K",
    statLabel: "popular budget",
    tone: "mint",
    artVariant: "value",
    action: "Browse value picks",
  },
  {
    title: "Side-by-side compare",
    copy: "Put specifications, prices and practical differences in one view instead of opening separate tabs.",
    to: "/compare",
    icon: FaExchangeAlt,
    statKey: "comparisons",
    statLabel: "live matchups",
    tone: "violet",
    artVariant: "compare",
    action: "Start comparing",
  },
  {
    title: "Technology newsroom",
    copy: "Follow launches, software updates and the product context that helps you make a better decision.",
    to: "/news",
    icon: FaNewspaper,
    statValue: "Live",
    statLabel: "editorial desk",
    tone: "coral",
    artVariant: "newsroom",
    action: "Read the newsroom",
  },
];

const DecisionStudio = () => {
  const { categoryCounts } = useHomeData();

  return (
    <section className="home-pathways" aria-labelledby="home-pathways-title">
      <div className="hooks-container">
        <div className="home-pathways__heading">
          <div>
            <p className="home-v2-eyebrow">Start with your question</p>
            <h2 id="home-pathways-title">Choose the fastest route to your answer</h2>
          </div>
          <p>
            Four focused research tools, each built around live catalogue and editorial data.
          </p>
        </div>

        <div className="home-pathways__grid">
          {researchPaths.map((item, index) => {
            const Icon = item.icon;
            const stat = item.statKey
              ? formatCompact(categoryCounts[item.statKey])
              : item.statValue;

            return (
              <Link
                key={item.title}
                to={item.to}
                className={`home-pathway-card is-${item.tone}`}
                aria-label={`${item.action}: ${item.title}`}
              >
                <div className="home-pathway-card__topline">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <small>Research path</small>
                </div>

                <div className="home-pathway-card__visual">
                  <SmartDeviceArt variant={item.artVariant} />
                </div>

                <div className="home-pathway-card__content">
                  <span className="home-pathway-card__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>

                <div className="home-pathway-card__footer">
                  <span className="home-pathway-card__stat">
                    <b>{stat}</b>
                    <small>{item.statLabel}</small>
                  </span>
                  <span className="home-pathway-card__action">
                    {item.action}
                    <FaArrowRight aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DecisionStudio;
