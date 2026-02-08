import React from "react";
import useTitle from "../../hooks/useTitle";

const Contact = () => {
  useTitle({ page: "Contact" });

  const contacts = [
    {
      label: "Support",
      detail: "support@hook.com",
      helper: "Questions about orders, returns, or comparisons.",
    },
    {
      label: "Partnerships",
      detail: "partners@hook.com",
      helper: "Brand or distribution inquiries.",
    },
    {
      label: "Press",
      detail: "press@hook.com",
      helper: "Media requests or statements.",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-10">
        <section className="rounded-2xl bg-white/80 backdrop-blur shadow-xl border border-white/70 p-6 sm:p-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/10 to-blue-600/10 text-xs font-semibold text-purple-700 uppercase tracking-[0.16em]">
            Contact
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            We respond with real humans
          </h1>
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
            Reach out and you will hear from someone on the Hook team - no bots
            sending canned replies. We aim to respond within one business day.
          </p>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          {contacts.map((item) => (
            <div
              key={item.label}
              className="p-5 sm:p-6 rounded-xl bg-white shadow-lg shadow-indigo-100 border border-gray-100 flex flex-col gap-2"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {item.label}
              </h2>
              <p className="text-indigo-700 font-medium">{item.detail}</p>
              <p className="text-gray-600 text-sm sm:text-base">{item.helper}</p>
            </div>
          ))}
          <div className="p-5 sm:p-6 rounded-xl bg-white shadow-lg shadow-indigo-100 border border-gray-100 sm:col-span-2 flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Office hours</h3>
            <p className="text-gray-700 text-sm sm:text-base">
              Monday to Friday, 9:00-18:00 (UTC). If you contact us outside these
              hours, we will reply as soon as we are back online.
            </p>
            <p className="text-gray-700 text-sm sm:text-base">
              Prefer talking? Call +1 (555) 013-1200 and leave a short message;
              we will return the call with a clear answer rather than a script.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Contact;
