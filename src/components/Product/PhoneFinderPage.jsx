import React, { useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../utils/apiUrl.js";
import { createSmartphoneDetailPath } from "../../utils/slugGenerator";
import SEO from "../SEO";
import {
  FaArrowRight,
  FaBatteryFull,
  FaCamera,
  FaCheck,
  FaGamepad,
  FaMobileAlt,
  FaRobot,
  FaShieldAlt,
  FaStar,
  FaBolt,
  FaMicrochip,
  FaFilter,
  FaSlidersH,
} from "react-icons/fa";

const budgets = [
  [10000, 15000, "₹10K - ₹15K"],
  [15000, 20000, "₹15K - ₹20K"],
  [20000, 30000, "₹20K - ₹30K"],
  [30000, 40000, "₹30K - ₹40K"],
  [40000, 50000, "₹40K - ₹50K"],
  [50000, 75000, "₹50K - ₹75K"],
  [75000, 100000, "₹75K - ₹1L"],
  [100000, 250000, "₹1L+"],
];

const primaryUses = [
  ["camera", "Camera & photography", FaCamera],
  ["gaming", "Gaming", FaGamepad],
  ["battery", "Battery & heavy usage", FaBatteryFull],
  ["performance", "Performance & multitasking", FaMicrochip],
  ["entertainment", "Movies & entertainment", FaMobileAlt],
  ["work", "Work & business", FaShieldAlt],
  ["ai", "AI features", FaRobot],
  ["balanced", "Balanced / everything", FaStar],
];

const priorities = [
  ["camera", "Camera", FaCamera],
  ["performance", "Performance", FaMicrochip],
  ["battery", "Battery", FaBatteryFull],
  ["display", "Display", FaMobileAlt],
  ["gaming", "Gaming", FaGamepad],
  ["ai", "AI", FaRobot],
  ["software", "Software", FaShieldAlt],
  ["design", "Design", FaMobileAlt],
  ["charging", "Fast charging", FaBolt],
  ["durability", "Durability", FaShieldAlt],
  ["value", "Value for money", FaStar],
];

const mustHaves = [
  ["5g", "5G"],
  ["nfc", "NFC"],
  ["esim", "eSIM"],
  ["wirelessCharging", "Wireless charging"],
  ["ipRating", "IP rating"],
  ["telephoto", "Telephoto"],
  ["headphoneJack", "Headphone jack"],
  ["none", "None"],
];

const initialProfile = {
  minBudget: 15000,
  maxBudget: 20000,
  primaryUse: "",
  priorities: [],
  os: "no_preference",
  usageDuration: "2-3_years",
  size: "no_preference",
  mustHave: [],
};

const FieldLabel = ({ children, hint }) => (
  <div className="mb-3">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-extrabold tracking-tight text-[#0f172a] sm:text-base">
        {children}
      </h2>
      {hint ? (
        <span className="text-[11px] font-semibold text-[#94a3b8]">{hint}</span>
      ) : null}
    </div>
  </div>
);

function ChoicePill({
  selected,
  onClick,
  children,
  icon: Icon,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "group relative flex min-h-[44px] min-w-0 items-center gap-2 rounded-2xl border text-left transition-all active:scale-[0.99]",
        compact ? "px-3 py-2.5" : "px-3 py-2.5",
        selected
          ? "border-blue-500 bg-blue-50 text-[#0f172a]"
          : "border-[#e2e8f0] bg-white text-[#475569] hover:border-blue-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {Icon ? (
        <span
          className={[
            "grid h-8 w-8 shrink-0 place-items-center rounded-xl transition",
            selected
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600",
          ].join(" ")}
        >
          <Icon className="text-xs" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1 text-[12px] font-bold leading-4 sm:text-sm sm:leading-5">
        {children}
      </span>
      {selected ? (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
          <FaCheck className="text-[9px]" />
        </span>
      ) : null}
    </button>
  );
}

const Section = ({ number, title, hint, children }) => (
  <section className="border-b border-slate-100 pb-5 last:border-b-0 last:pb-0 sm:pb-6">
    <div className="mb-3 flex items-center gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[11px] font-black text-blue-700 ring-1 ring-blue-100">
        {number}
      </span>
      <div className="min-w-0">
        <FieldLabel hint={hint}>{title}</FieldLabel>
      </div>
    </div>
    {children}
  </section>
);

const getPhoneImage = (phone) =>
  phone?.image ||
  phone?.image_url ||
  phone?.imageUrl ||
  phone?.thumbnail ||
  phone?.thumbnailUrl ||
  phone?.images?.[0] ||
  phone?.image_urls?.[0] ||
  "";

const getPhoneDetailPath = (phone) =>
  phone?.url ||
  phone?.path ||
  createSmartphoneDetailPath(
    phone?.name ||
      phone?.product_name ||
      phone?.productName ||
      phone?.model ||
      phone?.id,
  );

const getPhoneDetailState = (phone) => ({
  productId: phone?.product_id ?? phone?.productId ?? phone?.id ?? null,
});

const getScore = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : 0;
};

const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

export default function PhoneFinderPage() {
  const [profile, setProfile] = useState(initialProfile);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateProfile = (key, value) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const togglePriority = (value) =>
    updateProfile(
      "priorities",
      profile.priorities.includes(value)
        ? profile.priorities.filter((item) => item !== value)
        : profile.priorities.length < 3
          ? [...profile.priorities, value]
          : profile.priorities,
    );

  const toggleMustHave = (value) =>
    updateProfile(
      "mustHave",
      value === "none"
        ? ["none"]
        : profile.mustHave.includes(value)
          ? profile.mustHave.filter((item) => item !== value)
          : [...profile.mustHave.filter((item) => item !== "none"), value],
    );

  const budgetValue = `${profile.minBudget}-${profile.maxBudget}`;

  const submitFinder = async (event) => {
    event.preventDefault();

    if (!profile.primaryUse || profile.priorities.length === 0) {
      setError(
        "Choose a primary use and at least one priority before finding your phone.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/smartphones/finder"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          filters: {
            minPrice: profile.minBudget,
            maxPrice: profile.maxBudget,
            fiveG: profile.mustHave.includes("5g"),
          },
          limit: 6,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.message || "Unable to load phone recommendations.",
        );
      }

      setResults(payload);
    } catch (err) {
      setError(err.message || "Something went wrong while finding phones.");
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const cards = results?.results || [];
  const topMatch = results?.bestMatch || cards[0];

  return (
    <main className="hooks-smartphone-finder-page min-h-screen bg-[#f3f6fb] text-[#0f172a]">
      <SEO
        title="Phone Finder India | Find the Right Smartphone for You | MobilesX"
        description="Find the best smartphone for your needs in India. Choose your budget, priorities and must-have features to get personalized smartphone matches from MobilesX."
        url="https://mobilesx.in/phone-finder"
      />
      <section className="relative isolate overflow-hidden border-b border-blue-100/80 bg-transparent">
        <div className="pointer-events-none absolute -left-24 top-6 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-cyan-100/60 blur-3xl" />

        <div className="relative mx-auto w-full max-w-[1440px] px-3 pb-6 pt-3 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500"
          >
            <a href="/smartphones" className="transition hover:text-blue-700">
              Smartphones
            </a>
            <span>/</span>
            <span className="text-slate-800">Phone Finder</span>
          </nav>

          <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-7">
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                Personalised smartphone finder
              </div>

              <h1 className="max-w-4xl font-[Space_Grotesk] text-[2rem] font-bold leading-[1.04] tracking-[-0.045em] text-[#0f172a] sm:text-5xl lg:text-6xl">
                Find the phone that fits you
              </h1>

              <p className="mt-2 max-w-3xl text-[13px] leading-5 text-[#64748b] sm:mt-3 sm:text-base sm:leading-6">
                Choose your budget, priorities and must-have features. MobilesX
                filters eligible phones first, then ranks the strongest matches.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  <FaFilter className="text-blue-600" />
                  Smart filters
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  <FaStar className="text-blue-600" />
                  MobilesX scoring
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                  <FaRobot className="text-blue-600" />
                  Clear explanations
                </span>
              </div>
            </div>

            <div className="hidden xl:block">
              <div className="relative mx-auto h-44 w-full max-w-[280px]">
                <div className="absolute inset-6 rounded-full bg-blue-400/15 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-200/80" />
                <div className="absolute left-1/2 top-1/2 h-24 w-56 -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded-full border border-indigo-200/70" />
                <div className="absolute left-[28%] top-2 h-36 w-[74px] -rotate-12 rounded-[21px] bg-slate-950 p-1.5">
                  <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-blue-500 via-indigo-600 to-slate-900">
                    <span className="absolute left-2 top-2 h-7 w-7 rounded-lg bg-slate-950/60" />
                  </div>
                </div>
                <div className="absolute left-[47%] top-0 h-40 w-[80px] rotate-6 rounded-[22px] bg-slate-950 p-1.5">
                  <div className="relative h-full w-full overflow-hidden rounded-[17px] bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700">
                    <span className="absolute left-1/2 top-2 h-2 w-2 -translate-x-1/2 rounded-full bg-slate-950/80" />
                  </div>
                </div>
                <span className="absolute left-1 top-5 grid h-10 w-10 place-items-center rounded-xl bg-white/85 text-blue-600 ring-1 ring-blue-100 backdrop-blur">
                  <FaRobot />
                </span>
                <span className="absolute right-1 top-7 grid h-10 w-10 place-items-center rounded-xl bg-white/85 text-blue-600 ring-1 ring-blue-100 backdrop-blur">
                  <FaBolt />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 px-3 py-4 sm:px-6 sm:py-7 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:py-8">
        <form
          onSubmit={submitFinder}
          className="rounded-[24px] border border-blue-200 bg-transparent sm:rounded-[28px]"
        >
          <div className="rounded-t-[24px] border-b border-blue-100 bg-transparent px-4 py-3 sm:rounded-t-[28px] sm:px-6 sm:py-4 lg:sticky lg:top-0 lg:z-10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
                  Build your profile
                </div>
                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                  Tell us what matters
                </h2>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <FaSlidersH />
              </span>
            </div>
          </div>

          <div className="space-y-5 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
            <Section number="1" title="What's your budget?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {budgets.map(([min, max, label]) => (
                  <ChoicePill
                    key={`${min}-${max}`}
                    selected={budgetValue === `${min}-${max}`}
                    onClick={() => {
                      updateProfile("minBudget", min);
                      updateProfile("maxBudget", max);
                    }}
                    compact
                  >
                    {label}
                  </ChoicePill>
                ))}
              </div>
            </Section>

            <Section
              number="2"
              title="What will you mainly use your phone for?"
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {primaryUses.map(([value, label, Icon]) => (
                  <ChoicePill
                    key={value}
                    selected={profile.primaryUse === value}
                    onClick={() => updateProfile("primaryUse", value)}
                    icon={Icon}
                  >
                    {label}
                  </ChoicePill>
                ))}
              </div>
            </Section>

            <Section
              number="3"
              title="What are your top priorities?"
              hint="Choose up to 3"
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {priorities.map(([value, label, Icon]) => (
                  <ChoicePill
                    key={value}
                    selected={profile.priorities.includes(value)}
                    onClick={() => togglePriority(value)}
                    icon={Icon}
                    compact
                  >
                    {label}
                  </ChoicePill>
                ))}
              </div>
            </Section>

            <Section number="4" title="Which operating system do you prefer?">
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["android", "Android"],
                  ["ios", "iPhone / iOS"],
                  ["no_preference", "No preference"],
                ].map(([value, label]) => (
                  <ChoicePill
                    key={value}
                    selected={profile.os === value}
                    onClick={() => updateProfile("os", value)}
                    compact
                  >
                    {label}
                  </ChoicePill>
                ))}
              </div>
            </Section>

            <Section number="5" title="How long do you want to keep the phone?">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["1-2_years", "1–2 years"],
                  ["2-3_years", "2–3 years"],
                  ["3-4_years", "3–4 years"],
                  ["4_plus_years", "4+ years"],
                ].map(([value, label]) => (
                  <ChoicePill
                    key={value}
                    selected={profile.usageDuration === value}
                    onClick={() => updateProfile("usageDuration", value)}
                    compact
                  >
                    {label}
                  </ChoicePill>
                ))}
              </div>
            </Section>

            <Section number="6" title="What size do you prefer?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["compact", "Compact"],
                  ["medium", "Medium"],
                  ["large", "Large"],
                  ["no_preference", "No preference"],
                ].map(([value, label]) => (
                  <ChoicePill
                    key={value}
                    selected={profile.size === value}
                    onClick={() => updateProfile("size", value)}
                    compact
                  >
                    {label}
                  </ChoicePill>
                ))}
              </div>
            </Section>

            <Section number="7" title="Any must-have features?" hint="Optional">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {mustHaves.map(([value, label]) => (
                  <ChoicePill
                    key={value}
                    selected={profile.mustHave.includes(value)}
                    onClick={() => toggleMustHave(value)}
                    compact
                  >
                    {label}
                  </ChoicePill>
                ))}
              </div>
            </Section>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Finding your best matches..." : "Find my phone"}
              {!loading ? <FaArrowRight className="text-xs" /> : null}
            </button>

            <p className="text-center text-[11px] leading-5 text-slate-400">
              Mandatory choices remove phones that do not qualify. Your
              priorities decide the ranking of the remaining phones.
            </p>
          </div>
        </form>

        <section className="min-w-0 space-y-4">
          {topMatch ? (
            <>
              <article className="overflow-hidden rounded-[28px] border border-blue-200 bg-transparent">
                <div className="border-b border-slate-100 bg-transparent px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-700">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-white">
                        <FaStar className="text-[9px]" />
                      </span>
                      Best match
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                      {getScore(topMatch.matchScore)}% match
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:p-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <Link
                    to={getPhoneDetailPath(topMatch)}
                    state={getPhoneDetailState(topMatch)}
                    aria-label={`View ${topMatch.name}`}
                    className="flex min-h-[150px] items-center justify-center rounded-2xl bg-slate-50 no-underline transition hover:bg-blue-50 sm:min-h-[190px]"
                  >
                    {getPhoneImage(topMatch) ? (
                      <img
                        src={getPhoneImage(topMatch)}
                        alt={topMatch.name}
                        className="h-44 w-full object-contain p-3 sm:h-52 sm:p-4"
                        loading="eager"
                      />
                    ) : (
                      <div className="grid h-24 w-16 place-items-center rounded-[18px] bg-slate-900 text-white">
                        <FaMobileAlt />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                          Recommended for you
                        </span>
                        <Link
                          to={getPhoneDetailPath(topMatch)}
                          state={getPhoneDetailState(topMatch)}
                          className="mt-1 block text-2xl font-black tracking-tight text-slate-950 no-underline hover:text-blue-700 sm:text-3xl"
                        >
                          {topMatch.name}
                        </Link>
                        {topMatch.price || topMatch.minPrice ? (
                          <div className="mt-2 text-lg font-black text-slate-900">
                            {formatPrice(topMatch.price || topMatch.minPrice)}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {(topMatch.reasons || []).slice(0, 4).map((reason) => (
                        <div
                          key={reason}
                          className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
                        >
                          <FaCheck className="mt-0.5 shrink-0 text-xs text-emerald-600" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    {topMatch.tradeoffs?.length ? (
                      <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-800">
                        <span className="font-black">Trade-off:</span>{" "}
                        {topMatch.tradeoffs[0]}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={getPhoneDetailPath(topMatch)}
                        state={getPhoneDetailState(topMatch)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-blue-700"
                      >
                        View phone
                        <FaArrowRight className="text-[9px]" />
                      </Link>
                      <a
                        href={
                          topMatch.compareUrl ||
                          topMatch.comparePath ||
                          "/compare"
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                      >
                        Compare
                      </a>
                    </div>
                  </div>
                </div>
              </article>

              {cards.length > 1 ? (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <h3 className="text-lg font-black tracking-tight text-slate-950">
                      More matches
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      Ranked alternatives
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {cards.slice(1).map((phone) => (
                      <Link
                        key={phone.id || phone.name}
                        to={getPhoneDetailPath(phone)}
                        state={getPhoneDetailState(phone)}
                        aria-label={`View ${phone.name}`}
                        className="block rounded-2xl border border-blue-100 bg-transparent p-3.5 no-underline transition hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-16 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-50">
                            {getPhoneImage(phone) ? (
                              <img
                                src={getPhoneImage(phone)}
                                alt={phone.name}
                                className="h-full w-full object-contain p-2"
                                loading="lazy"
                              />
                            ) : (
                              <FaMobileAlt className="text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-black text-slate-950">
                              {phone.name}
                            </div>
                            <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                              {phone.reasons?.[0] || "Matches your profile"}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-sm font-black text-emerald-700">
                              {getScore(phone.matchScore)}%
                            </div>
                            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              match
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="grid min-h-[280px] place-items-center rounded-[24px] border border-dashed border-blue-200 bg-transparent p-6 text-center sm:min-h-[420px] sm:rounded-[28px] sm:p-8">
              <div className="max-w-md">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-600">
                  <FaMobileAlt className="text-xl" />
                </div>
                <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                  Your recommendations will appear here
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Pick your budget, primary use and top priorities. The finder
                  will first remove phones that fail your requirements, then
                  rank the strongest matches.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
