import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";

const normalizeText = (value) => String(value || "").trim();

const toNumber = (value) => {
  if (value == null || value === "") return null;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeLaunchStatus = (value) => {
  const text = normalizeText(value).toLowerCase();
  if (!text) return "";
  if (/rumou?r/.test(text)) return "rumored";
  if (/announce/.test(text)) return "announced";
  if (/(upcoming|coming soon|expected|launching soon|pre[-\s]?order|pre[-\s]?book)/i.test(text)) {
    return "upcoming";
  }
  if (/(available|released|launched|in stock|on sale|out now)/i.test(text)) {
    return "released";
  }
  return text;
};

const getPhoneName = (device) =>
  normalizeText(device?.name || device?.model || device?.title);

const getPhoneKey = (device) => {
  const id =
    device?.productId ??
    device?.product_id ??
    device?.baseId ??
    device?.base_id ??
    null;
  if (id != null && String(id).trim()) return `id:${id}`;
  return `name:${getPhoneName(device).toLowerCase()}`;
};

const getHookScore = (device) =>
  toNumber(
    device?.Hookss_score ??
      device?.HookssScore ??
      device?.hook_score ??
      device?.hookScore,
  );

const getTrendScore = (device) =>
  toNumber(device?.trend_velocity ?? device?.trendVelocity);

const getFreshnessScore = (device) =>
  toNumber(device?.freshness ?? device?.freshness_score);

const getBuyerIntentScore = (device) =>
  toNumber(device?.buyer_intent ?? device?.buyerIntent);

const getPopularityScore = (device, index) => {
  const hookScore = getHookScore(device) ?? 0;
  const buyerIntent = getBuyerIntentScore(device) ?? 0;
  const trendScore = getTrendScore(device) ?? 0;
  const freshness = getFreshnessScore(device) ?? 0;
  const rating = toNumber(device?.rating) ?? 0;

  const score =
    buyerIntent * 0.38 +
    trendScore * 0.28 +
    hookScore * 0.24 +
    freshness * 0.08 +
    rating * 2;

  return score || Math.max(0, 1000 - index);
};

const getLaunchDate = (device) =>
  parseDate(
    device?.launchDate ||
      device?.launch_date ||
      device?.saleStartDate ||
      device?.sale_start_date,
  );

const isUpcomingPhone = (device, now = new Date()) => {
  const stage = normalizeLaunchStatus(
    device?.launchStatus ||
      device?.launch_status ||
      device?.launchStatusOverride ||
      device?.launch_status_override ||
      device?.status ||
      device?.availability,
  );
  if (stage === "rumored" || stage === "announced" || stage === "upcoming") {
    return true;
  }
  if (device?.is_prebooking === true || device?.isPrebooking === true) {
    return true;
  }

  const launchDate = getLaunchDate(device);
  return Boolean(launchDate && launchDate > now);
};

const uniquePhones = (devices = []) => {
  const seen = new Set();
  return (Array.isArray(devices) ? devices : [])
    .filter((device) => getPhoneName(device))
    .filter((device) => {
      const key = getPhoneKey(device);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const takeNames = (items = [], limit = 5) => items.slice(0, limit);

const HighlightPhoneLinks = ({ phones = [] }) => {
  if (!phones.length) {
    return <span className="text-slate-500">Updates coming soon</span>;
  }

  return (
    <span>
      {phones.map((phone, index) => {
        const name = getPhoneName(phone);
        const path = createProductPath("smartphones", name);

        return (
          <React.Fragment key={`${getPhoneKey(phone)}-${index}`}>
            <Link
              to={path}
              className="font-semibold text-blue-900 transition-colors hover:text-blue-700"
            >
              {name}
            </Link>
            {index < phones.length - 1 ? ", " : null}
          </React.Fragment>
        );
      })}
    </span>
  );
};

const MobilePhoneHighlights = ({ devices = [], className = "" }) => {
  const rows = useMemo(() => {
    const now = new Date();
    const phones = uniquePhones(devices);
    if (!phones.length) return [];

    const byPopularity = [...phones].sort(
      (a, b) =>
        getPopularityScore(b, phones.indexOf(b)) -
        getPopularityScore(a, phones.indexOf(a)),
    );

    const byTrending = [...phones]
      .filter((phone) => getTrendScore(phone) != null)
      .sort((a, b) => (getTrendScore(b) || 0) - (getTrendScore(a) || 0));

    const latestPhones = [...phones]
      .map((phone) => ({ phone, date: getLaunchDate(phone) }))
      .filter((item) => item.date && item.date <= now)
      .sort((a, b) => b.date - a.date)
      .map((item) => item.phone);

    const upcomingPhones = [...phones]
      .filter((phone) => isUpcomingPhone(phone, now))
      .sort((a, b) => {
        const left = getLaunchDate(a);
        const right = getLaunchDate(b);
        if (left && right) return left - right;
        if (left) return -1;
        if (right) return 1;
        return getPopularityScore(b, 0) - getPopularityScore(a, 0);
      });

    const hookScorePhones = [...phones]
      .filter((phone) => getHookScore(phone) != null)
      .sort((a, b) => (getHookScore(b) || 0) - (getHookScore(a) || 0));

    return [
      {
        label: "Popular Phones",
        phones: takeNames(byPopularity),
      },
      {
        label: "Trending Phones",
        phones: takeNames(byTrending.length ? byTrending : byPopularity),
      },
      {
        label: "Latest Phones",
        phones: takeNames(latestPhones),
      },
      {
        label: "Upcoming Phones",
        phones: takeNames(upcomingPhones),
      },
      {
        label: "Highest Hook Scores",
        phones: takeNames(hookScorePhones),
      },
    ].filter((row) => row.phones.length);
  }, [devices]);

  if (!rows.length) return null;

  return (
    <section
      className={`mx-auto w-full max-w-7xl rounded-lg border border-blue-100 bg-transparent px-4 py-5 sm:px-5 sm:py-6 ${className}`}
    >
      <div className="border-b border-blue-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
          Key Highlights
        </p>
        <h2 className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
          Popular Mobile Phones in India
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
          Quick snapshot across popular, trending, latest, upcoming, and highest
          Hook Score phones.
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-blue-100 bg-white">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={`grid gap-0 text-[15px] leading-6 text-blue-950 sm:grid-cols-[238px_minmax(0,1fr)] ${
              index > 0 ? "border-t border-blue-100" : ""
            }`}
          >
            <div className="border-b border-blue-100 bg-blue-50/40 px-4 py-4 font-bold text-blue-900 sm:border-b-0 sm:border-r sm:px-6 sm:py-5">
              {row.label}
            </div>
            <div className="px-4 py-4 font-medium sm:px-6 sm:py-5">
              <HighlightPhoneLinks phones={row.phones} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MobilePhoneHighlights;
