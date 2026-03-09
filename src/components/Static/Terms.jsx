import React from "react";
import useTitle from "../../hooks/useTitle";

const Terms = () => {
  useTitle({ page: "Terms" });

  const updatedOn = "March 9, 2026";

  const termsParagraphs = [
    "Access to Hooks constitutes acceptance of these terms. Hooks functions as a device research and comparison platform that publishes structured specifications, pricing references, trend indicators, and decision-support insights. The service is designed to support informed product evaluation and does not replace independent buyer verification where material purchase decisions are involved.",
    "Hooks is not a direct seller of products on this website. No checkout operation is provided for product purchases, and no card, UPI, bank, or wallet payment credentials are collected by Hooks for marketplace transactions. Returns, refunds, shipping commitments, warranties, cancellations, and after-sales obligations remain exclusively with the third-party seller or official brand store where a transaction is completed.",
    "Product data, pricing snapshots, and availability indicators may change without prior notice due to source updates, regional variance, launch-stage changes, or seller-side modifications. Although reasonable efforts are applied to maintain current information quality, no representation is made that every listing remains complete, error-free, or continuously available. Critical commercial details should be confirmed with the relevant seller or official brand source before any purchase action.",
    "Use of the platform must remain lawful and non-disruptive. Unauthorized system access, automated abuse, data scraping intended to harm service reliability, reverse engineering, impersonation, and any conduct that interferes with platform integrity are prohibited. Feedback or feature suggestions submitted to Hooks may be used on a non-exclusive basis for product improvement; personally identifying attribution is not published without explicit consent.",
    "External links are provided for user convenience. Third-party websites operate under independent legal, privacy, and commercial terms outside Hooks control. To the extent permitted by applicable law, Hooks disclaims liability for third-party transaction outcomes, seller conduct, and off-platform contractual disputes. These terms are interpreted under applicable law in the jurisdiction of platform operation, subject to mandatory statutory consumer protections. Legal inquiries may be directed to legal@hook.com.",
  ];

  return (
    <main className="min-h-screen bg-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <section className="py-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Terms and Conditions
          </h1>
          <p className="text-sm text-gray-500">Last updated: {updatedOn}</p>
        </section>

        <section className="space-y-0">
          {termsParagraphs.map((paragraph, index) => (
            <div key={index} className={index === 0 ? "pt-0" : "pt-4"}>
              <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                {paragraph}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default Terms;
