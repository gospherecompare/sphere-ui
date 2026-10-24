import React from "react";
import SEO from "../SEO";

const SmartphonePriceHistory = () => (
  <>
    <SEO
      title="Price history unavailable | MobilesX"
      description="MobilesX no longer provides price tracking or historical price charts."
    />
    <main className="smartphone-price-history-page min-h-[calc(100vh-4.5rem)] w-full bg-white px-4 py-10">
      <section className="mx-auto flex min-h-[55vh] w-full max-w-5xl items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
            MobilesX
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Price history is unavailable
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            MobilesX no longer provides price tracking or historical price charts.
            Current product and retailer prices are shown on the product page.
          </p>
        </div>
      </section>
    </main>
  </>
);

export default SmartphonePriceHistory;
