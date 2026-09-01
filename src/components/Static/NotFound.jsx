import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toCanonicalPageUrl } from "../../utils/publicUrl";

const NotFound = () => {
  const location = useLocation();
  const path = location?.pathname || "/";
  const canonicalUrl = toCanonicalPageUrl(path || "/");

  return (
    <>
      <SEO
        title="Page Not Found | MobilesX"
        description="The page you are looking for was not found. Explore smartphones, laptops, TVs, and trending products on MobilesX."
        url={canonicalUrl}
        robots="noindex, nofollow"
      />
      <main className="hooks-not-found min-h-[65vh] flex items-center justify-center px-4 sm:px-6 py-10">
        <section className="hooks-not-found__card w-full max-w-3xl rounded-2xl border border-gray-200 bg-white/95 shadow-sm p-6 sm:p-10 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] text-purple-700 uppercase">
            Error 404
          </p>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
            This page took a wrong turn
          </h1>
          <p className="mt-4 text-sm sm:text-base text-gray-600">
            The address does not match an active Hooks page:
          </p>
          <p className="mt-1 text-sm sm:text-base font-medium text-gray-900 break-all">
            {path}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:opacity-95 transition"
            >
              Return home
            </Link>
            <Link
              to="/trending/smartphones"
              className="px-4 py-2 rounded-lg border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition"
            >
              Explore trending
            </Link>
            <Link
              to="/smartphones"
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Browse phones
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default NotFound;
