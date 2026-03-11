import React from "react";
import useTitle from "../../hooks/useTitle";

const About = () => {
  useTitle({ page: "About" });

  return (
    <main className="min-h-screen bg-white max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-1 space-y-10">
        <section className="rounded-2xl bg-white/80 backdrop-blur  p-1 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/10 to-blue-600/10 text-xs font-semibold text-purple-700 uppercase tracking-[0.16em]">
            About Hooks
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Independent technology discovery and comparisons
          </h1>
          <div className="space-y-3 text-base sm:text-lg text-gray-700 leading-relaxed">
            <p>
              Hooks is an independent technology discovery and comparison
              platform designed to help users make informed purchasing decisions
              with confidence.
            </p>
            <p>
              The modern consumer faces an overwhelming number of choices across
              smartphones, laptops, networking products, and home appliances.
              Specifications vary widely, pricing changes frequently, and
              meaningful comparisons are often difficult to find. Hooks
              addresses this challenge by presenting structured, transparent,
              and data-driven product information in a clear and accessible
              format.
            </p>
            <p>
              Our platform aggregates detailed specifications, pricing variants,
              feature comparisons, and usage trends to enable objective
              evaluation of products across categories. By focusing on accuracy
              and clarity, Hooks allows users to assess alternatives efficiently
              and identify products that best match their requirements and
              budgets.
            </p>
            <p>
              Hooks operates as a neutral information platform. We do not
              manufacture or sell products. Our goal is to provide reliable
              insights that empower users to compare options, understand
              trade-offs, and make well-informed decisions.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;
