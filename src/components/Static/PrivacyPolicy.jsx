import React from "react";
import useTitle from "../../hooks/useTitle";

const PrivacyPolicy = () => {
  useTitle({ page: "Privacy Policy" });

  const updatedOn = "March 9, 2026";

  const policyParagraphs = [
    "Hooks operates as a product research and comparison platform that publishes structured device insights, specifications, price references, and decision-support content. Hooks is not a direct seller of products on this website. No checkout flow is operated for product purchases, no card, UPI, or bank payment credentials are collected for transactions, and no return or refund process is administered for third-party stores.",
    "Data collection is limited to information required for legitimate platform operations. This may include account identifiers (such as name, email address, and authentication credentials), session-level technical telemetry (including device type, browser, visited pages, and performance diagnostics), and communications submitted through support or partnership channels. For business collaboration workflows, professional contact information and operational correspondence may be processed as required.",
    "Processing activities are restricted to service reliability, comparison-quality improvement, misuse detection, account security, and support fulfilment. Personal information is not sold, and confidential business information is not repurposed for unrelated commercial objectives. Data access is controlled by role-based authorization and business necessity. Infrastructure, analytics, and communication vendors are engaged only under binding confidentiality and data-protection obligations.",
    "Links to external marketplaces or official brand stores are governed by third-party terms. Those third-party properties independently control transaction handling, payment processing, shipping commitments, return rules, refund conditions, and privacy practices. Hooks is not the merchant of record for purchases completed outside this website.",
    "Security controls include restricted access, credential safeguards, encrypted transport, and monitoring measures designed to reduce operational risk. Data is retained only for lawful service, legal, security, and compliance requirements, and is deleted or anonymized under internal retention schedules once no longer required. Requests for access, correction, or deletion of eligible personal information may be sent to privacy@hook.com. Platform support requests may be sent to support@hook.com. Policy updates are reflected on this page with a revised effective date.",
  ];

  return (
    <main className="min-h-screen bg-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <section className="py-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500">Last updated: {updatedOn}</p>
        </section>

        <section className="space-y-0">
          {policyParagraphs.map((paragraph, index) => (
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

export default PrivacyPolicy;
