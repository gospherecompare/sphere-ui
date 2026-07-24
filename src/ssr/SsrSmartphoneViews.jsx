import React from "react";
import {
  formatInr,
  resolveImage,
  resolveLowestPrice,
  summarizeSpecs,
  toSmartphonePath,
} from "./publicData.js";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const ProductImage = ({ device, className = "" }) => {
  const image = resolveImage(device);
  const name = device?.name || device?.product_name || "Smartphone";
  return (
    <div
      className={`flex min-h-[190px] items-center justify-center rounded-2xl bg-slate-50 p-5 ${className}`}
    >
      <img
        src={image}
        alt={name}
        className="max-h-64 w-full object-contain"
        loading="eager"
      />
    </div>
  );
};

const SpecPills = ({ specs = [] }) => (
  <div className="flex flex-wrap gap-2">
    {specs.slice(0, 6).map((spec) => (
      <span
        key={spec}
        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-950"
      >
        {spec}
      </span>
    ))}
  </div>
);

const CompetitorList = ({ competitors = [] }) => {
  if (!competitors.length) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">Competitor insights</h2>
        <p className="mt-2 text-sm text-slate-600">
          Closest competitor cards are being calculated for this device.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">Closest competitors</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {competitors.map((item) => {
          const price = resolveLowestPrice(item) ?? item?.price;
          return (
            <a
              key={item?.id || item?.name}
              href={toSmartphonePath(item)}
              className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img
                  src={resolveImage(item)}
                  alt={item?.name || "Competitor phone"}
                  className="h-14 w-14 rounded-lg object-contain"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {item?.name || "Smartphone"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item?.brand || item?.brand_name || "Smartphone"}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Match score</span>
                <span className="font-bold text-blue-700">
                  {Math.round(Number(item?.competition_score) || 0) || "-"}
                </span>
              </div>
              {price != null && (
                <p className="mt-1 text-sm font-bold text-emerald-700">
                  {formatInr(price)}
                </p>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
};

export const SsrSmartphoneDetail = ({ product, competitors = [] }) => {
  const name = product?.name || product?.product_name || "Smartphone";
  const price = resolveLowestPrice(product);
  const specs = summarizeSpecs(product);
  const launchDate = formatDate(product?.launch_date || product?.launchDate);

  return (
    <main className="bg-slate-50 text-slate-950">
      <Header />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 text-sm text-slate-500">
          <a href="/" className="hover:text-blue-700">
            Home
          </a>{" "}
          /{" "}
          <a href="/smartphones" className="hover:text-blue-700">
            Smartphones
          </a>{" "}
          / <span>{name}</span>
        </nav>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="grid gap-8 md:grid-cols-[340px_1fr]">
            <ProductImage device={product} />
            <div>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
                    Smartphone
                  </p>
                  <h1 className="mt-2 text-3xl font-extrabold text-blue-950 md:text-5xl">
                    {name}
                  </h1>
                  <p className="mt-2 text-slate-500">
                    {product?.brand || product?.brand_name || "Hooks"} live
                    launch and specification profile.
                  </p>
                </div>
                {price != null && (
                  <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
                      Price
                    </p>
                    <p className="text-3xl font-black">{formatInr(price)}</p>
                  </div>
                )}
              </div>
              {launchDate && (
                <p className="mt-5 text-sm font-semibold text-slate-600">
                  Launch date: <span className="text-slate-950">{launchDate}</span>
                </p>
              )}
              <div className="mt-5">
                <SpecPills specs={specs} />
              </div>
              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <Info label="Display" value={specs.find((x) => /inch|display/i.test(x))} />
                <Info label="Battery" value={specs.find((x) => /mah|battery/i.test(x))} />
                <Info label="Processor" value={specs.find((x) => /snapdragon|mediatek|dimensity|bionic|exynos/i.test(x))} />
                <Info label="Camera" value={specs.find((x) => /camera|mp/i.test(x))} />
              </dl>
            </div>
          </div>
        </section>
        <div className="mt-6">
          <CompetitorList competitors={competitors} />
        </div>
      </div>
    </main>
  );
};

const Info = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <dt className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 font-bold text-slate-950">{value || "To be confirmed"}</dd>
  </div>
);

export const SsrUpcomingSmartphones = ({ phones = [] }) => (
  <main className="bg-slate-50 text-slate-950">
    <Header />
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          Upcoming mobiles
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-blue-950 md:text-5xl">
          Upcoming Smartphones in India
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Live server-rendered launch list with expected prices, launch dates,
          chipset, battery, display, and camera highlights.
        </p>
      </section>
      <div className="grid gap-4">
        {phones.map((phone) => {
          const price = resolveLowestPrice(phone);
          const specs = summarizeSpecs(phone);
          const launchDate = formatDate(phone?.launch_date || phone?.launchDate);
          return (
            <article
              key={phone?.id || phone?.name}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6"
            >
              <div className="grid gap-5 md:grid-cols-[180px_1fr_auto] md:items-center">
                <ProductImage device={phone} className="min-h-[150px]" />
                <div>
                  <a href={toSmartphonePath(phone)}>
                    <h2 className="text-2xl font-extrabold text-blue-950 hover:text-blue-700">
                      {phone?.name || phone?.product_name || "Upcoming smartphone"}
                    </h2>
                  </a>
                  <p className="mt-1 text-sm text-slate-500">
                    {phone?.brand || phone?.brand_name || "Brand"}{" "}
                    {launchDate ? `launch date: ${launchDate}` : "launch date to be confirmed"}
                  </p>
                  <div className="mt-3">
                    <SpecPills specs={specs} />
                  </div>
                </div>
                {price != null && (
                  <div className="rounded-xl bg-blue-50 px-5 py-4 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-500">
                      Expected price
                    </p>
                    <p className="text-2xl font-black text-blue-950">
                      {formatInr(price)}
                    </p>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  </main>
);

const Header = () => (
  <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
      <a href="/" className="text-2xl font-black tracking-tight text-blue-700">
        HOOKS
      </a>
      <nav className="hidden gap-5 text-sm font-bold uppercase tracking-[0.14em] text-slate-600 md:flex">
        <a href="/smartphones" className="hover:text-blue-700">
          Smartphones
        </a>
        <a href="/smartphones/upcoming" className="hover:text-blue-700">
          Upcoming
        </a>
        <a href="/compare" className="hover:text-blue-700">
          Compare
        </a>
        <a href="/news" className="hover:text-blue-700">
          News
        </a>
      </nav>
    </div>
  </header>
);
