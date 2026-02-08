import React from "react";
import useTitle from "../../hooks/useTitle";

const Terms = () => {
  useTitle({ page: "Terms" });

  const updatedOn = "February 8, 2026";

  const sections = [
    {
      title: "Using Hook",
      body:
        "Hook is for personal, lawful use only. Do not misuse the site, interfere with services, or reverse-engineer our code. Accounts must contain accurate information.",
    },
    {
      title: "Content and accuracy",
      body:
        "Product details change. We work to keep pages current, but availability and pricing can shift without notice. Always confirm key specs with the seller before purchasing.",
    },
    {
      title: "Limitations",
      body:
        "Hook provides guidance, not a warranty. To the extent the law allows, we disclaim implied warranties and limit liability to the amount you paid us (usually zero).",
    },
    {
      title: "User submissions",
      body:
        "If you share feedback or suggestions, you grant Hook a non-exclusive right to use them to improve the product. We will not publish your name without consent.",
    },
    {
      title: "Governing law",
      body:
        "These terms are governed by the laws of your home state in the U.S., without regard to conflict-of-law rules. Disputes will be handled in that jurisdiction.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <section className="rounded-2xl bg-white/80 backdrop-blur shadow-xl border border-white/70 p-6 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/10 to-blue-600/10 text-xs font-semibold text-purple-700 uppercase tracking-[0.16em]">
            Terms
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Straightforward terms for using Hook
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            These terms avoid boilerplate and focus on how Hook actually operates.
            Please read them before browsing, comparing products, or creating an
            account.
          </p>
          <p className="text-sm text-gray-500">Last updated: {updatedOn}</p>
        </section>

        <section className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.title}
              className="p-5 sm:p-6 rounded-xl bg-white shadow-lg shadow-indigo-100 border border-gray-100"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                {section.title}
              </h2>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                {section.body}
              </p>
            </div>
          ))}
        </section>

        <section className="p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-blue-900 text-white space-y-2 shadow-lg shadow-indigo-200">
          <h3 className="text-lg font-semibold">Need clarification?</h3>
          <p className="text-sm sm:text-base">
            Contact legal@hook.com with your question. We reply with specific,
            plain-language answers rather than template responses.
          </p>
        </section>
      </div>
    </main>
  );
};

export default Terms;
