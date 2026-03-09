import React from "react";
import useTitle from "../../hooks/useTitle";

const Contact = () => {
  useTitle({ page: "Contact" });

  const contacts = [
    {
      label: "Partnerships",
      detail: "gospherecompare@gmail.com",
      helper: "Brand collaborations, data partnerships, or media inquiries.",
    },
  ];

  return (
    <main className="min-h-screen bg-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-1 space-y-2">
        <section className="py-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600/10 to-blue-600/10 text-xs font-semibold text-purple-700 uppercase tracking-[0.16em]">
            Contact
          </div>
        </section>

        <section className="sm:grid-cols-2">
          {contacts.map((item) => (
            <div
              key={item.label}
              className="p-5 sm:p-6 rounded-xl bg-white flex flex-col gap-2"
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {item.label}
              </h2>
              <p className="text-indigo-700 font-medium">{item.detail}</p>
              <p className="text-gray-600 text-sm sm:text-base">
                {item.helper}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default Contact;
