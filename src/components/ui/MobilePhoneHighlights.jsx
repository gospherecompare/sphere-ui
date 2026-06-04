import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in/api";
const SMARTPHONE_HIGHLIGHTS_ENDPOINT = `${API_BASE}/public/smartphones/highlights`;

const normalizeText = (value) => String(value || "").trim();

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
  if (
    /(upcoming|coming soon|expected|launching soon|pre[-\s]?order|pre[-\s]?book)/i.test(
      text,
    )
  ) {
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

const normalizeServerHighlightRows = (body) => {
  const rows = Array.isArray(body?.highlights) ? body.highlights : [];
  return rows
    .map((row) => ({
      label: normalizeText(row?.label),
      phones: (Array.isArray(row?.phones) ? row.phones : [])
        .map((phone) => ({
          ...phone,
          id: phone?.product_id ?? phone?.id ?? null,
          product_id: phone?.product_id ?? phone?.id ?? null,
          name: phone?.name ?? phone?.model ?? "",
          model: phone?.model ?? phone?.name ?? "",
        }))
        .filter((phone) => getPhoneName(phone)),
    }))
    .filter((row) => row.label && row.phones.length > 0);
};

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
  const [serverRows, setServerRows] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(SMARTPHONE_HIGHLIGHTS_ENDPOINT, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json();
        const normalized = normalizeServerHighlightRows(body);
        if (!cancelled && normalized.length > 0) {
          setServerRows(normalized);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const fallbackRows = useMemo(() => {
    const now = new Date();
    const phones = uniquePhones(devices);
    if (!phones.length) return [];

    const rankedPhones = phones.filter((phone) => !isUpcomingPhone(phone, now));

    const latestPhones = [...phones]
      .map((phone) => ({ phone, date: getLaunchDate(phone) }))
      .filter(
        (item) =>
          item.date && item.date <= now && !isUpcomingPhone(item.phone, now),
      )
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
        return getPhoneName(a).localeCompare(getPhoneName(b));
      });

    return [
      {
        label: "Popular Phones",
        phones: takeNames(rankedPhones.length ? rankedPhones : phones),
      },
      {
        label: "Trending Phones",
        phones: takeNames(rankedPhones.length ? rankedPhones : phones),
      },
      {
        label: "Latest Phones",
        phones: takeNames(latestPhones),
      },
      {
        label: "Upcoming Phones",
        phones: takeNames(upcomingPhones),
      },
    ].filter((row) => row.phones.length);
  }, [devices]);

  const rows = serverRows.length > 0 ? serverRows : fallbackRows;

  if (!rows.length) return null;

  return (
    <section
      className={`mx-auto w-full max-w-7xl rounded-2xl border border-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-transparent px-4 py-5 sm:px-5 sm:py-6 ${className}`}
    >
      <div className="border-b border-blue-100 pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
          Key Highlights
        </p>
        <h2 className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
          Popular Mobile Phones in India
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
          Quick snapshot across popular, trending, latest, and upcoming phones.
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
