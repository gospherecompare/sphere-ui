// src/components/Home/UpcomingSmartphones.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaCalendarAlt, FaMobileAlt } from "react-icons/fa";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");

const toText = (value) => {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = toText(item);
      if (normalized) return normalized;
    }
    return null;
  }
  if (typeof value === "object") {
    const objectCandidate =
      toText(value?.value) ||
      toText(value?.label) ||
      toText(value?.name) ||
      toText(value?.text) ||
      toText(value?.title) ||
      toText(value?.display);
    if (objectCandidate) return objectCandidate;

    const amount = toText(value?.amount ?? value?.val);
    const unit = toText(value?.unit ?? value?.uom);
    if (amount && unit) return `${amount} ${unit}`;
    return null;
  }
  const text = String(value).trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  if (
    lower === "null" ||
    lower === "undefined" ||
    lower === "n/a" ||
    lower === "na"
  ) {
    return null;
  }
  return text.replace(/\s+/g, " ");
};

const firstText = (...values) => {
  for (const value of values) {
    const normalized = toText(value);
    if (normalized) return normalized;
  }
  return null;
};

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number") {
    const dt = new Date(value);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const text = String(value).trim();
  if (!text) return null;
  const dt = new Date(text);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const normalizeLaunchStatus = (value) => {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  if (!text) return null;
  if (/rumou?r/.test(text)) return "rumored";
  if (/announce/.test(text)) return "announced";
  if (/(pre[-\s]?order|pre[-\s]?book|prebooking|presale)/i.test(text))
    return "upcoming";
  if (/(upcoming|coming soon|expected|launching soon)/i.test(text))
    return "upcoming";
  if (/(available|on sale|in stock)/i.test(text)) return "available";
  if (/(released|launched|out now)/i.test(text)) return "released";
  return null;
};

const formatUpcomingDate = (value) => {
  const dt = parseDateValue(value);
  if (!dt) return null;
  return dt.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

const getTrendingRows = (json) => {
  if (Array.isArray(json?.trending)) return json.trending;
  if (Array.isArray(json?.smartphones)) return json.smartphones;
  if (Array.isArray(json)) return json;
  return [];
};

const getRowName = (row) =>
  firstText(
    row?.name,
    row?.product_name,
    row?.model,
    row?.basic_info?.product_name,
    row?.basic_info?.title,
    row?.basic_info?.model,
  ) || "";

const getRowImage = (row) => {
  const topImage = firstText(row?.image, row?.image_url, row?.product_image);
  if (topImage) return topImage;

  if (Array.isArray(row?.images) && row.images.length) {
    return firstText(row.images[0]) || "";
  }
  if (Array.isArray(row?.metadata?.images) && row.metadata.images.length) {
    return firstText(row.metadata.images[0]) || "";
  }

  return "";
};

const getRowBrand = (row) =>
  firstText(
    row?.brand,
    row?.brand_name,
    row?.basic_info?.brand_name,
    row?.basic_info?.brand,
  );

const formatLaunchStatusText = (status) => {
  if (!status) return "Upcoming";
  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getUpcomingBadgeLabel = (device) => {
  const status = String(device?.launchStatus || "").toLowerCase();
  if (status === "rumored") return "Rumored";
  if (status === "announced") return "Announced";
  if (device?.launchLabel || status === "upcoming") return "Coming Soon";
  return "Upcoming";
};

const getUpcomingBadgeTone = (device) => {
  const status = String(device?.launchStatus || "").toLowerCase();
  if (status === "rumored") return "bg-slate-900 text-white";
  if (status === "announced") return "bg-violet-600 text-white";
  if (device?.launchLabel || status === "upcoming")
    return "bg-yellow-600 text-white";
  return "bg-cyan-600 text-white";
};

const UpcomingSmartphoneCard = ({ device, index, isLoaded, onClick }) => {
  const deviceName = device?.name || "Upcoming smartphone";
  const badgeLabel = getUpcomingBadgeLabel(device);
  const badgeTone = getUpcomingBadgeTone(device);
  const launchText = device?.launchLabel
    ? `Expected ${device.launchLabel}`
    : formatLaunchStatusText(device?.launchStatus || device?.status);

  return (
    <button
      type="button"
      aria-label={`Open ${deviceName}`}
      onClick={onClick}
      className={`group relative flex h-full w-[74vw] max-w-[17rem] shrink-0 snap-start flex-col overflow-hidden border border-slate-200 bg-white text-left shadow-[0_10px_22px_rgba(15,23,42,0.12)] transition-all duration-300 hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.16)] sm:w-[18rem] lg:w-[19rem] ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" />

      <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-3 sm:p-5">
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-[1.5rem] bg-white/90 ring-1 ring-slate-200 sm:h-48">
          <span
            className={`absolute left-3 top-3 z-10 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] shadow-sm ${badgeTone}`}
          >
            {badgeLabel}
          </span>

          {device.image ? (
            <img
              src={device.image}
              alt={deviceName}
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <FaMobileAlt className="text-3xl text-slate-300" />
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        {device.brand ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-600">
            {device.brand}
          </p>
        ) : null}

        <h6 className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition-colors duration-200 group-hover:text-blue-600 sm:text-xl">
          {deviceName}
        </h6>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3 sm:pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
              Launch
            </p>
            <div className="mt-1 flex items-center gap-2">
              <FaCalendarAlt className="text-xs text-slate-400" />
              <p className="text-sm font-semibold tracking-tight text-slate-900 sm:text-lg">
                {launchText}
              </p>
            </div>
          </div>

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-sm text-white shadow-lg transition-transform duration-300 group-hover:translate-x-1 sm:h-11 sm:w-11 sm:text-base">
            →
          </span>
        </div>
      </div>
    </button>
  );
};

const getRowLaunchDate = (row) =>
  firstText(
    row?.launch_date,
    row?.launchDate,
    row?.expected_launch_date,
    row?.expectedLaunchDate,
    row?.release_date,
    row?.releaseDate,
    row?.basic_info?.launch_date,
    row?.basic_info?.release_date,
  );

const getRowSaleStartDate = (row) =>
  firstText(
    row?.sale_start_date,
    row?.saleStartDate,
    row?.sale_start,
    row?.saleStart,
    row?.first_sale_date,
    row?.firstSaleDate,
    row?.available_from,
    row?.availableFrom,
  );

const getStoreSaleStartDate = (store) =>
  firstText(
    store?.sale_start_date,
    store?.saleStartDate,
    store?.sale_date,
    store?.saleDate,
    store?.available_from,
    store?.availableFrom,
  );

const getEarliestSaleStartDate = (row) => {
  const dates = [];
  const direct = parseDateValue(getRowSaleStartDate(row));
  if (direct) dates.push(direct);

  const directStores = Array.isArray(row?.store_prices)
    ? row.store_prices
    : Array.isArray(row?.storePrices)
      ? row.storePrices
      : [];
  directStores.forEach((store) => {
    const dt = parseDateValue(getStoreSaleStartDate(store));
    if (dt) dates.push(dt);
  });

  const variants = Array.isArray(row?.variants)
    ? row.variants
    : Array.isArray(row?.variant)
      ? row.variant
      : Array.isArray(row?.variants_json)
        ? row.variants_json
        : [];
  for (const variant of variants) {
    const variantDate = parseDateValue(
      firstText(
        variant?.sale_start_date,
        variant?.saleStartDate,
        variant?.sale_date,
        variant?.saleDate,
      ),
    );
    if (variantDate) dates.push(variantDate);
    const stores = Array.isArray(variant?.store_prices)
      ? variant.store_prices
      : Array.isArray(variant?.storePrices)
        ? variant.storePrices
        : [];
    stores.forEach((store) => {
      const dt = parseDateValue(getStoreSaleStartDate(store));
      if (dt) dates.push(dt);
    });
  }

  if (!dates.length) return null;
  dates.sort((a, b) => a - b);
  return dates[0];
};

const getRowLaunchStatus = (row) => {
  const saleStart = getEarliestSaleStartDate(row);
  if (saleStart) {
    return saleStart > new Date() ? "upcoming" : "available";
  }

  const override = normalizeLaunchStatus(
    firstText(
      row?.launch_status_override,
      row?.launchStatusOverride,
      row?.launch_status,
      row?.launchStatus,
    ),
  );
  if (override) return override;

  const preorderUrl = firstText(
    row?.official_preorder_url,
    row?.officialPreorderUrl,
  );
  if (preorderUrl) return "upcoming";

  const status = normalizeLaunchStatus(
    firstText(row?.status, row?.availability, row?.badge),
  );
  if (status) return status;

  return null;
};

const isUpcomingRow = (row) => {
  const saleStart = getEarliestSaleStartDate(row);
  if (saleStart) return saleStart > new Date();

  const status = getRowLaunchStatus(row);
  if (status) return !["released", "available"].includes(status);

  const raw = getRowLaunchDate(row);
  const dt = parseDateValue(raw);
  if (dt && dt > new Date()) return true;
  const statusText = firstText(row?.status, row?.availability, row?.badge, raw);
  return Boolean(
    statusText &&
    /(upcoming|coming soon|expected|pre[-\s]?book|pre[-\s]?order|announced|rumored)/i.test(
      statusText,
    ),
  );
};

const UpcomingSmartphones = () => {
  const [currentDevices, setCurrentDevices] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();

  useEffect(() => {
    let cancelled = false;
    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      setCurrentDevices([]);
      const trendingEndpoint = "/api/public/trending/smartphones?limit=25";

      try {
        const trendingRes = await fetch(`${API_BASE}${trendingEndpoint}`);
        if (!trendingRes.ok)
          throw new Error("Failed to fetch upcoming smartphones");
        const trendingJson = await trendingRes.json();
        if (cancelled) return;

        const rows = getTrendingRows(trendingJson);
        const upcomingRows = rows.filter(isUpcomingRow);
        const mapped = upcomingRows.map((row, index) => ({
          id:
            row.product_id ??
            row.productId ??
            row.id ??
            row.basic_info?.id ??
            null,
          brand: getRowBrand(row),
          name: getRowName(row),
          image: getRowImage(row),
          launchDate: getRowLaunchDate(row),
          launchLabel: formatUpcomingDate(getRowLaunchDate(row)),
          launch_status: firstText(row?.launch_status, row?.launchStatus),
          launchStatus: getRowLaunchStatus(row),
          status: firstText(row?.status, row?.availability, row?.badge),
          _rowIndex: index,
        }));

        setCurrentDevices(mapped.slice(0, 12));
      } catch (err) {
        console.error("Failed to load upcoming smartphones:", err);
        setCurrentDevices([]);
      } finally {
        if (!cancelled) setLoadingUpcoming(false);
      }
    };

    fetchUpcoming();
    return () => {
      cancelled = true;
    };
  }, []);

  const getDevicePath = (device) => {
    const rawName = device.name || String(device.id || "device");
    const basePath = createProductPath("smartphones", rawName);
    const params = new URLSearchParams();
    if (device.id) params.set("id", String(device.id));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const handleDeviceClick = (device) => {
    navigate(getDevicePath(device));
  };

  return (
    <section
      className={`relative isolate overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        {/* Header Section */}
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-8 text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Upcoming{" "}
            <span className="bg-gradient-to-r from-cyan-200 via-white to-sky-100 bg-clip-text text-transparent animate-pulse">
              Smartphones
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-white/85 sm:mt-6 sm:text-xl sm:leading-8">
            Keep track of devices expected to launch soon.
          </p>
        </div>

        {/* Section Divider */}
        <div className="mt-14 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-white/80">
            📱 Featured Upcoming
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        </div>

        {loadingUpcoming ? null : currentDevices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-white/70">
              No upcoming smartphones available right now.
            </p>
          </div>
        ) : null}

        {/* Products Row - Horizontal scroll with fixed-size cards */}
        <div className="no-scrollbar mt-8 flex snap-x snap-mandatory overflow-x-auto gap-2 pb-4 scroll-smooth sm:gap-4 lg:gap-5">
          {loadingUpcoming
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="w-[74vw] max-w-[17rem] shrink-0 animate-pulse sm:w-[18rem] lg:w-[19rem]"
                >
                  <div className="overflow-hidden border border-slate-200 bg-white shadow-[0_10px_22px_rgba(15,23,42,0.12)]">
                    <div className="h-1 bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400" />
                    <div className="p-3 sm:p-5">
                      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-[1.5rem] bg-slate-100 ring-1 ring-slate-200 sm:h-48">
                        <div className="h-14 w-10 rounded-full bg-slate-200" />
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-2.5 w-20 rounded-full bg-slate-200" />
                        <div className="h-4 w-4/5 rounded bg-slate-200" />
                        <div className="h-3 w-3/4 rounded bg-slate-200" />
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                        <div className="space-y-2">
                          <div className="h-2.5 w-16 rounded bg-slate-200" />
                          <div className="h-3 w-28 rounded bg-slate-200" />
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            : currentDevices.map((device, i) => (
                <UpcomingSmartphoneCard
                  key={`${device.id || "noid"}-${i}`}
                  device={device}
                  index={i}
                  isLoaded={isLoaded}
                  onClick={() => handleDeviceClick(device)}
                />
              ))}
        </div>

        {/* View All Link */}
        {!loadingUpcoming && currentDevices.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              to="/smartphones/upcoming"
              className="group rounded-full border border-white/25 bg-white/8 px-6 py-3 text-white/95 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/15 hover:shadow-lg font-semibold"
            >
              View all upcoming smartphones →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default UpcomingSmartphones;
