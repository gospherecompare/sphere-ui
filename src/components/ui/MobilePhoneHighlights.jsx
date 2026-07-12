import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in/api";
const SMARTPHONE_HIGHLIGHTS_ENDPOINT = `${API_BASE}/public/smartphones/highlights`;

const normalizeText = (value) => String(value || "").trim();

const getLocalDateOnlyString = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateOnlyString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return getLocalDateOnlyString(value);
  const raw = String(value).trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const dmyMatch = raw.match(/^(\d{1,2})[\s/-](\d{1,2})[\s/-](\d{4})$/);
  if (dmyMatch) {
    const day = String(Number(dmyMatch[1])).padStart(2, "0");
    const month = String(Number(dmyMatch[2])).padStart(2, "0");
    return `${dmyMatch[3]}-${month}-${day}`;
  }
  return getLocalDateOnlyString(raw);
};

const parseDate = (value) => {
  const dateOnly = normalizeDateOnlyString(value);
  if (!dateOnly) return null;
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
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
      device?.createdAt ||
      device?.created_at ||
      device?.saleStartDate ||
      device?.sale_start_date,
  );

const isFutureDate = (value) => {
  const dateOnly = normalizeDateOnlyString(value);
  const today = getLocalDateOnlyString();
  return Boolean(dateOnly && today && dateOnly > today);
};

const normalizeLaunchStatus = (value) => {
  const text = String(value || "").toLowerCase();
  if (/(upcoming|coming soon|expected|scheduled)/i.test(text))
    return "upcoming";
  if (/(rumou?r|announce)/i.test(text)) return "upcoming";
  return "";
};

const hasStoreRows = (device) => {
  const rows = [];
  if (Array.isArray(device?.store_prices)) rows.push(...device.store_prices);
  if (Array.isArray(device?.storePrices)) rows.push(...device.storePrices);
  for (const variant of Array.isArray(device?.variants)
    ? device.variants
    : []) {
    if (Array.isArray(variant?.store_prices))
      rows.push(...variant.store_prices);
    if (Array.isArray(variant?.storePrices)) rows.push(...variant.storePrices);
  }
  return rows.some((row) =>
    normalizeText(
      row?.store_name ||
        row?.storeName ||
        row?.store ||
        row?.url ||
        row?.price ||
        row?.sale_start_date ||
        row?.saleStartDate,
    ),
  );
};

const getSaleStartDate = (device) => {
  const direct =
    device?.sale_start_date ||
    device?.saleStartDate ||
    device?.sale_date ||
    device?.saleDate ||
    device?.predicted_available_date ||
    device?.predictedAvailableDate ||
    null;
  if (normalizeDateOnlyString(direct)) return direct;

  const storeRows = [];
  if (Array.isArray(device?.store_prices))
    storeRows.push(...device.store_prices);
  if (Array.isArray(device?.storePrices)) storeRows.push(...device.storePrices);
  for (const store of storeRows) {
    const storeDate =
      store?.sale_start_date ||
      store?.saleStartDate ||
      store?.sale_date ||
      store?.saleDate ||
      store?.available_from ||
      store?.availableFrom ||
      null;
    if (normalizeDateOnlyString(storeDate)) return storeDate;
  }

  for (const variant of Array.isArray(device?.variants)
    ? device.variants
    : []) {
    const variantDate =
      variant?.sale_start_date ||
      variant?.saleStartDate ||
      variant?.sale_date ||
      variant?.saleDate ||
      null;
    if (normalizeDateOnlyString(variantDate)) return variantDate;

    const variantStores = [];
    if (Array.isArray(variant?.store_prices))
      variantStores.push(...variant.store_prices);
    if (Array.isArray(variant?.storePrices))
      variantStores.push(...variant.storePrices);
    for (const store of variantStores) {
      const storeDate =
        store?.sale_start_date ||
        store?.saleStartDate ||
        store?.sale_date ||
        store?.saleDate ||
        store?.available_from ||
        store?.availableFrom ||
        null;
      if (normalizeDateOnlyString(storeDate)) return storeDate;
    }
  }

  return null;
};

const isUpcomingPhone = (device) => {
  if (isFutureDate(getSaleStartDate(device))) return true;
  if (!hasStoreRows(device)) return true;
  return false;
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

const sortLatestPhones = (devices = []) =>
  uniquePhones(devices)
    .map((phone) => ({ phone, date: getLaunchDate(phone) }))
    .sort((a, b) => {
      if (a.date && b.date) return b.date - a.date;
      if (a.date) return -1;
      if (b.date) return 1;
      return getPhoneName(a.phone).localeCompare(getPhoneName(b.phone));
    })
    .map((item) => item.phone);

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

const HighlightPhoneLinks = ({ phones = [], compact = false }) => {
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
              className={`font-semibold text-blue-900 transition-colors hover:text-blue-700 ${
                compact ? "leading-4" : ""
              }`}
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

const MobilePhoneHighlights = ({
  devices = [],
  className = "",
  context = "default",
}) => {
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
    const phones = uniquePhones(devices);
    if (!phones.length) return [];

    return [
      {
        label: "Popular Phones",
        phones: takeNames(phones),
      },
      {
        label: "Upcoming Phones",
        phones: takeNames(phones.filter(isUpcomingPhone)),
      },
      {
        label: "Trending Phones",
        phones: takeNames(phones),
      },
      {
        label: "Latest Phones",
        phones: takeNames(sortLatestPhones(phones)),
      },
    ].filter((row) => row.phones.length);
  }, [devices]);

  const rows = serverRows.length > 0 ? serverRows : fallbackRows;
  const mobileRows = rows.slice(0, 2);
  const highlightTitle =
    context === "upcoming"
      ? "Upcoming Mobile Phones in India"
      : context === "latest"
      ? "Latest Mobile Phones in India"
      : "Mobile Phone Highlights in India";

  if (!rows.length) return null;

  return (
    <div className={`mx-auto w-full max-w-7xl ${className}`}>
      <section className="rounded-lg border border-slate-100 bg-white px-3 py-4 shadow-[0_2px_2px_rgba(0,0,0,0.1)] sm:rounded-2xl sm:px-5 sm:py-6">
        <div className="sm:hidden">
          <h2 className="text-[13px] font-semibold leading-5 text-slate-950">
            {highlightTitle}{" "}
            <span className="text-blue-600">- Key Highlights</span>
          </h2>

          <div className="mt-3 overflow-hidden rounded-md border-1 border-slate-100">
            {mobileRows.map((row, index) => (
              <div
                key={row.label}
                className={`grid grid-cols-[4.15rem_minmax(0,1fr)] text-[9.5px] leading-4 text-blue-950 ${
                  index > 0 ? "border-t-2 border-slate-100" : ""
                }`}
              >
                <div className="border-r-2 border-slate-100 bg-blue-50/50 px-2 py-2 font-bold text-blue-900">
                  {row.label}
                </div>
                <div className="px-2 py-2 font-medium">
                  <HighlightPhoneLinks
                    compact
                    phones={takeNames(row.phones, 5)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="border-b-1 border-blue-500 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
              Key Highlights
            </p>
            <h2 className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              {highlightTitle}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
              Quick snapshot across trending and latest phones.
            </p>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border-1 border-slate-200 bg-white">
            {rows.map((row, index) => (
              <div
                key={row.label}
                className={`grid gap-0 text-[15px] leading-6 text-blue-950 sm:grid-cols-[238px_minmax(0,1fr)] ${
                  index > 0 ? "border-t-2 border-slate-200" : ""
                }`}
              >
                <div className="border-b-2 border-slate-200 bg-blue-50/50 px-4 py-4 font-bold text-blue-900 sm:border-b-0 sm:border-r-2 sm:px-6 sm:py-5">
                  {row.label}
                </div>
                <div className="px-4 py-4 font-medium sm:px-6 sm:py-5">
                  <HighlightPhoneLinks phones={row.phones} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobilePhoneHighlights;
