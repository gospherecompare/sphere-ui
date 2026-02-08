import React from "react";
import useTitle from "../../hooks/useTitle";

const PrivacyPolicy = () => {
  useTitle({ page: "Privacy Policy" });

  const updatedOn = "February 8, 2026";

  const sections = [
    {
      title: "Information we collect",
      body:
        "We collect only what we need to deliver comparisons and support: account details you provide, device data for troubleshooting, and minimal analytics to understand performance. We do not buy data sets, and we do not record sensitive categories.",
    },
    {
      title: "How we use it",
      body:
        "Data powers core features - showing accurate prices, saving your comparisons, and replying to support. We do not sell, rent, or trade your data. Any AI-assisted summaries are reviewed by a human before being shown.",
    },
    {
      title: "Sharing",
      body:
        "We share data only with service providers that help us run Hook (hosting, analytics, email). They follow contractual confidentiality requirements and cannot use your data for their own marketing.",
    },
    {
      title: "Retention",
      body:
        "We keep personal data only while we have a reason to serve you. You can request deletion at any time by emailing privacy@hook.com. Backups age out on a rolling schedule.",
    },
    {
      title: "Your choices",
      body:
        "You can access, correct, or erase your data by contacting us. If you disable cookies, core site features still work; analytics may become less precise, which is fine with us.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <section className="rounded-2xl bg-white/80 backdrop-blur shadow-xl border border-white/70 p-6 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/10 to-blue-600/10 text-xs font-semibold text-purple-700 uppercase tracking-[0.16em]">
            Privacy
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Privacy policy built for users, not algorithms
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            This page is intentionally plain. It tells you what we collect, why
            we collect it, and how to opt out without legal filler or SEO noise.
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
          <h3 className="text-lg font-semibold">Have a question?</h3>
          <p className="text-sm sm:text-base">
            Email privacy@hook.com with a brief description. We respond with the
            same team that writes our policies - no autoresponders.
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
