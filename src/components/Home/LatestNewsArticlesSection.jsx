import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBolt,
  FaClock,
  FaLink,
  FaNewspaper,
  FaSignal,
} from "react-icons/fa";
import {
  createNewsStoryPath,
  usePublicNewsFeed,
} from "../../hooks/usePublicNews";
import { HomeSkeleton } from "./HomeUi";
import SmartDeviceArt from "./SmartDeviceArt";

const artVariantForStory = (story) => {
  const category = String(story?.category || "").toLowerCase();
  if (/launch|smartphone|mobile|gadget|wearable/.test(category))
    return "launch";
  if (/chip|ai|software|cloud|internet|cyber/.test(category))
    return "performance";
  return "newsroom";
};

const StoryImage = ({ story, className = "" }) => {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(story?.image) && !failed;

  return (
    <div className={`hooks-newsroom-image ${className}`.trim()}>
      {hasImage ? (
        <img
          src={story.image}
          alt={story.heroImageAlt || story.title}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <SmartDeviceArt
          variant={artVariantForStory(story)}
          className="hooks-newsroom-image__art"
        />
      )}
      <span>{story.label || "Technology"}</span>
    </div>
  );
};

const LatestNewsArticlesSection = () => {
  const { stories, loading, error } = usePublicNewsFeed({ limit: 12 });

  const uniqueStories = useMemo(() => {
    const seen = new Set();

    return stories.filter((story) => {
      const key = String(
        story?.slug || story?.id || story?.title || "",
      ).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [stories]);

  const lead = uniqueStories[0] || null;
  const features = uniqueStories.slice(1, 4);
  const briefings = uniqueStories.slice(4, 9);

  const newsroomStats = useMemo(() => {
    const topics = [];
    const seenTopics = new Set();

    uniqueStories.forEach((story) => {
      const key = String(story.category || story.label || "").trim();
      const normalizedKey = key.toLowerCase();
      if (!key || seenTopics.has(normalizedKey)) return;
      seenTopics.add(normalizedKey);
      topics.push({ key: normalizedKey, label: story.label || key });
    });

    return {
      topics: topics.slice(0, 5),
      productLinked: uniqueStories.filter((story) => story.productLinked)
        .length,
      priority: uniqueStories.filter(
        (story) => story.featured || story.trending || story.pinned,
      ).length,
    };
  }, [uniqueStories]);

  return (
    <section
      className="hooks-newsroom-section"
      aria-labelledby="hooks-newsroom-title"
    >
      <div className="hooks-container">
        <div className="hooks-newsroom-shell">
          <header className="hooks-newsroom-masthead">
            <div className="hooks-newsroom-masthead__copy">
              <p>
                <FaSignal aria-hidden="true" /> MobilesX newsroom
              </p>
              <h2 id="hooks-newsroom-title">
                Technology news designed for better product decisions
              </h2>
              <span>
                Launch coverage, practical explainers and product-linked
                reporting from the live MobilesX editorial feed.
              </span>
            </div>

            <div className="hooks-newsroom-masthead__art">
              <SmartDeviceArt
                variant="newsroom"
                caption={`${uniqueStories.length} published stories`}
              />
            </div>
          </header>

          {loading && !lead ? <HomeSkeleton count={6} variant="news" /> : null}

          {!loading && !lead ? (
            <div className="hooks-newsroom-empty">
              <FaNewspaper aria-hidden="true" />
              <div>
                <h3>The newsroom feed is refreshing</h3>
                <p>{error || "Published stories will appear here shortly."}</p>
              </div>
              <Link to="/news">Visit the news page</Link>
            </div>
          ) : null}

          {lead ? (
            <div className="hooks-newsroom-layout">
              <div className="hooks-newsroom-primary">
                <Link
                  to={createNewsStoryPath(lead.slug)}
                  className="hooks-newsroom-lead"
                >
                  <StoryImage story={lead} className="is-cover" />
                  <div className="hooks-newsroom-lead__copy">
                    <div className="hooks-newsroom-meta">
                      <span>
                        <FaClock aria-hidden="true" /> {lead.publishedAt}
                      </span>
                      <span>{lead.readTime}</span>
                      {lead.productLinked ? (
                        <span>
                          <FaLink aria-hidden="true" /> Product linked
                        </span>
                      ) : null}
                    </div>

                    <p className="hooks-newsroom-lead__kicker">Top story</p>
                    <h3>{lead.title}</h3>
                    <p className="hooks-newsroom-lead__summary">
                      {lead.summary}
                    </p>

                    <div className="hooks-newsroom-lead__footer">
                      <span>
                        <b>{lead.author}</b>
                        <small>{lead.authorRole || "MobilesX newsroom"}</small>
                      </span>
                      <strong>
                        Read full story <FaArrowRight aria-hidden="true" />
                      </strong>
                    </div>
                  </div>
                </Link>

                {features.length ? (
                  <div
                    className="hooks-newsroom-features"
                    aria-label="Featured technology stories"
                  >
                    {features.map((story, index) => (
                      <Link
                        key={story.slug}
                        to={createNewsStoryPath(story.slug)}
                        className="hooks-newsroom-feature"
                      >
                        <StoryImage story={story} />
                        <div className="hooks-newsroom-feature__copy">
                          <div className="hooks-newsroom-feature__meta">
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <small>{story.readTime}</small>
                          </div>
                          <p>{story.label || "Technology"}</p>
                          <h3>{story.title}</h3>
                          <strong>
                            Read story <FaArrowRight aria-hidden="true" />
                          </strong>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>

              <aside
                className="hooks-newsroom-sidebar"
                aria-label="MobilesX newsroom live desk"
              >
                <div className="hooks-newsroom-pulse">
                  <div className="hooks-newsroom-pulse__heading">
                    <span>
                      <i /> Live desk
                    </span>
                    <FaBolt aria-hidden="true" />
                  </div>

                  <h3>One feed, organised around what matters next.</h3>

                  <div className="hooks-newsroom-pulse__metrics">
                    <span>
                      <b>{uniqueStories.length}</b>
                      <small>live stories</small>
                    </span>
                    <span>
                      <b>{newsroomStats.productLinked}</b>
                      <small>product linked</small>
                    </span>
                    <span>
                      <b>{newsroomStats.priority}</b>
                      <small>priority reads</small>
                    </span>
                  </div>

                  {newsroomStats.topics.length ? (
                    <div
                      className="hooks-newsroom-topics"
                      aria-label="Current newsroom topics"
                    >
                      {newsroomStats.topics.map((topic) => (
                        <span key={topic.key}>#{topic.label}</span>
                      ))}
                    </div>
                  ) : null}

                  <Link to="/news">
                    Open the full newsroom <FaArrowRight aria-hidden="true" />
                  </Link>
                </div>

                {briefings.length ? (
                  <div className="hooks-newsroom-briefings">
                    <div className="hooks-newsroom-briefings__heading">
                      <span>Latest briefings</span>
                      <small>From the live desk</small>
                    </div>

                    <div className="hooks-newsroom-briefings__list">
                      {briefings.map((story, index) => (
                        <Link
                          key={story.slug}
                          to={createNewsStoryPath(story.slug)}
                        >
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <div>
                            <small>
                              {story.label || "News"} · {story.publishedAt}
                            </small>
                            <h3>{story.title}</h3>
                          </div>
                          <FaArrowRight aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default LatestNewsArticlesSection;
