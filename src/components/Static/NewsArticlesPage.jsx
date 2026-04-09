import React from "react";
import SEO from "../SEO";
import NewsEditorialDesk from "../Home/NewsEditorialDesk";
import {
  createCollectionSchema,
  createItemListSchema,
} from "../../utils/schemaGenerators";
import {
  usePublicNewsFeed,
  useStoryListSchemaItems,
} from "../../hooks/usePublicNews";

const NewsArticlesPage = () => {
  const canonical = "https://tryhook.shop/news";
  const { stories, loading, error } = usePublicNewsFeed({ limit: 24 });
  const storySchemaItems = useStoryListSchemaItems(stories);

  const pageSchema = [
    createCollectionSchema({
      name: "Hooks News & Articles",
      description:
        "Browse the latest tech news, mobile updates, gadget guides, and launch coverage on Hooks.",
      url: canonical,
      image: "https://tryhook.shop/hook-logo.svg",
    }),
    createItemListSchema({
      name: "Latest News & Articles",
      url: canonical,
      items: storySchemaItems,
    }),
  ];

  return (
    <>
      <SEO
        title="News & Articles - Latest Mobile News, Gadget Guides & Launch Updates - Hooks"
        description="Browse the latest mobile news, gadget updates, launch coverage, and editorial guides on Hooks."
        url={canonical}
        robots="index, follow"
        ogType="website"
        image="https://tryhook.shop/hook-logo.svg"
        schema={pageSchema}
      />
      <NewsEditorialDesk stories={stories} loading={loading} error={error} />
    </>
  );
};

export default NewsArticlesPage;
