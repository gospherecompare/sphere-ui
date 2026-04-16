import React from "react";
import { Link } from "react-router-dom";
import { FaClock, FaUser, FaArrowRight } from "react-icons/fa";

const NewsArticleCard = ({
  article,
  featured = false,
  compact = false,
  className = "",
}) => {
  if (!article) return null;

  const {
    title = "Untitled Article",
    summary = "Read the full story for insights.",
    image = "",
    author = "Hooks Editorial",
    publishedAt = "",
    label = "News",
    slug = "",
  } = article;

  if (featured) {
    return (
      <Link
        to={`/news/${slug}`}
        className={`group relative isolate block overflow-hidden rounded-[12px] border border-slate-200 bg-slate-900 text-white transition-all hover:border-slate-400 hover:shadow-lg ${className}`}
      >
        {image && (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity duration-300 group-hover:opacity-50"
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/10" />

        <div className="relative flex min-h-96 flex-col justify-end p-6 sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2">
            <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {label}
            </span>
          </div>

          <h2
            className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl"
            style={{ textWrap: "balance" }}
          >
            {title}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200/90">
            {summary}
          </p>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-300">
              {author && (
                <span className="flex items-center gap-2">
                  <FaUser className="h-3 w-3" />
                  {author}
                </span>
              )}
              {publishedAt && (
                <span className="flex items-center gap-2">
                  <FaClock className="h-3 w-3" />
                  {publishedAt}
                </span>
              )}
            </div>
            <FaArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    );
  }

  // Regular card
  return (
    <Link
      to={`/news/${slug}`}
      className={`group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-yellow-100 transition-all hover:border-slate-300 hover:shadow-md ${className}`}
    >
      {/* Image Section */}
      {image && (
        <div className="relative h-32 overflow-hidden bg-slate-100">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Content Section */}
      <div className={compact ? "flex-1 p-3" : "flex-1 p-4"}>
        {/* Label */}
        {label && (
          <div className="inline-block">
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              {label}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          className={`mt-2 font-bold leading-tight text-slate-900 transition-colors group-hover:text-blue-600 ${
            compact ? "text-sm line-clamp-2" : "text-base line-clamp-3"
          }`}
        >
          {title}
        </h3>

        {/* Summary */}
        <p
          className={`mt-2 text-slate-600 line-clamp-2 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {summary}
        </p>

        {/* Meta Info */}
        <div
          className={`mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-slate-500 ${
            compact ? "text-xs" : "text-xs"
          }`}
        >
          {author && (
            <span className="flex items-center gap-1">
              <FaUser className="h-3 w-3" />
              {author}
            </span>
          )}
          {publishedAt && (
            <span className="flex items-center gap-1">
              <FaClock className="h-3 w-3" />
              {publishedAt}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default NewsArticleCard;
