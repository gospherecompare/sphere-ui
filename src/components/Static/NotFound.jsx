import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import useTitle from "../../hooks/useTitle";

const NotFound = () => {
  const location = useLocation();
  const path = location?.pathname || "/";

  useTitle({ page: "Page Not Found" });

  return (
    <main className="min-h-[65vh] flex items-center justify-center px-4 sm:px-6 py-10">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <meta
          name="description"
          content="The page you are looking for was not found. Explore smartphones, laptops, TVs, and trending products on Hook."
        />
      </Helmet>

      <section className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white/95 shadow-sm p-6 sm:p-10 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-purple-700 uppercase">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
          Page Not Found
        </h1>
        <p className="mt-4 text-sm sm:text-base text-gray-600">
          We could not find this page:
        </p>
        <p className="mt-1 text-sm sm:text-base font-medium text-gray-900 break-all">
          {path}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:opacity-95 transition"
          >
            Go To Home
          </Link>
          <Link
            to="/trending/smartphones"
            className="px-4 py-2 rounded-lg border border-purple-200 text-purple-700 text-sm font-semibold hover:bg-purple-50 transition"
          >
            View Trending
          </Link>
          <Link
            to="/smartphones"
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Browse Smartphones
          </Link>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
