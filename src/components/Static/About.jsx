import React from "react";
import useTitle from "../../hooks/useTitle";

const About = () => {
  useTitle({ page: "About" });

  return (
    <main className="min-h-screen bg-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <section className="rounded-2xl bg-white/80 backdrop-blur  p-6 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/10 to-blue-600/10 text-xs font-semibold text-purple-700 uppercase tracking-[0.16em]">
            About Hook
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Independent technology discovery and comparisons
          </h1>
          <div className="space-y-3 text-base sm:text-lg text-gray-700 leading-relaxed">
            <p>
              Hook is an independent technology discovery and comparison
              platform designed to help users make informed purchasing decisions
              with confidence.
            </p>
            <p>
              The modern consumer faces an overwhelming number of choices across
              smartphones, laptops, networking products, and home appliances.
              Specifications vary widely, pricing changes frequently, and
              meaningful comparisons are often difficult to find. Hook addresses
              this challenge by presenting structured, transparent, and
              data-driven product information in a clear and accessible format.
            </p>
            <p>
              Our platform aggregates detailed specifications, pricing variants,
              feature comparisons, and usage trends to enable objective
              evaluation of products across categories. By focusing on accuracy
              and clarity, Hook allows users to assess alternatives efficiently
              and identify products that best match their requirements and
              budgets.
            </p>
            <p>
              Hook operates as a neutral information platform. We do not
              manufacture or sell products. Our goal is to provide reliable
              insights that empower users to compare options, understand
              trade-offs, and make well-informed decisions.
            </p>
          </div>
        </section>

        <section className="p-5 sm:p-6 rounded-xl bg-white  space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Our Focus</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Comprehensive product specifications",
              "Side-by-side comparisons",
              "Pricing and variant analysis",
              "Trending and most-compared products",
              "Clear categorization across device types",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg  px-4 py-3 text-sm sm:text-base text-gray-800"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Our Mission",
              body: "To simplify complex technology choices by delivering accurate, transparent, and structured product comparisons.",
            },
            {
              title: "Our Vision",
              body: "To become a trusted reference platform for technology research and product evaluation.",
            },
            {
              title: "Commitment to Transparency",
              body: "Hook is built with a strong emphasis on data integrity, performance, and user experience. Content is presented objectively, without promotional bias, enabling users to rely on Hook as a dependable research resource.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-5 sm:p-6 rounded-xl bg-white flex flex-col gap-3"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default About;
