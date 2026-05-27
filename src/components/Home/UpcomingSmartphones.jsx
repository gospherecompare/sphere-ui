// src/components/Home/UpcomingSmartphones.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaArrowRight, FaMobileAlt } from "react-icons/fa";

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

const getRowReleaseDate = (row) =>
  firstText(
    row?.release_date,
    row?.releaseDate,
    row?.launch_date,
    row?.launchDate,
    row?.expected_launch_date,
    row?.expectedLaunchDate,
    row?.available_from,
    row?.availableFrom,
    row?.basic_info?.release_date,
    row?.basic_info?.launch_date,
  );

const isReleasedStatus = (status) => {
  const text = String(status || "")
    .trim()
    .toLowerCase();
  if (!text) return false;
  if (
    /(upcoming|coming soon|expected|rumou?r|announce|pre[-\s]?order|pre[-\s]?book|prebooking|presale)/i.test(
      text,
    )
  )
    return false;
  if (/(available|released|launched|out now|in stock|on sale)/i.test(text))
    return true;
  return false;
};

const isReleasedRow = (row) => {
  const releaseDate = parseDateValue(getRowReleaseDate(row));
  if (releaseDate) {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    if (releaseDate > todayEnd) return false;
    return true;
  }

  return isReleasedStatus(
    firstText(
      row?.launch_status,
      row?.launchStatus,
      row?.status,
      row?.availability,
      row?.badge,
    ),
  );
};

const getLatestRows = (json) => {
  if (Array.isArray(json?.new)) return json.new;
  if (Array.isArray(json?.latest)) return json.latest;
  if (Array.isArray(json?.launches)) return json.launches;
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
    row?.brand_name,
    row?.brand,
    row?.manufacturer,
    row?.basic_info?.brand,
    row?.basic_info?.brand_name,
    row?.specifications?.brand,
  );

const getShortLabel = (name, brand) => {
  const source = firstText(brand, name) || "Phone";
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const LatestSmartphoneCard = ({ device, index, isLoaded, onClick }) => {
  const deviceName = device?.name || "Latest smartphone";
  const [imageFailed, setImageFailed] = useState(false);
  const rank = String(index + 1).padStart(2, "0");

  return (
    <button
      type="button"
      aria-label={`Open ${deviceName}`}
      onClick={onClick}
      className={`group relative flex min-w-[15.25rem] shrink-0 flex-col overflow-hidden rounded-lg border border-cyan-200/12 bg-white/[0.055] p-2.5 text-left text-white shadow-[0_16px_48px_rgba(2,6,23,0.1)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/28 hover:bg-white/[0.085] sm:min-w-[16rem] sm:p-3 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="pointer-events-none absolute right-[-28%] top-[-42%] h-32 w-32 rounded-full bg-fuchsia-300/12 blur-3xl transition group-hover:bg-cyan-300/16" />
      <span className="pointer-events-none absolute bottom-4 right-4 text-5xl font-black leading-none text-white/[0.028]">
        {rank}
      </span>
      <div className="relative flex h-[8.5rem] w-full items-center justify-center overflow-visible sm:h-36">
        <span className="absolute bottom-3 h-10 w-24 rounded-full bg-cyan-100/12 blur-2xl" />
        <span className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-cyan-300/10 via-blue-500/8 to-fuchsia-400/10 blur-2xl" />
        {device.image && !imageFailed ? (
          <img
            src={device.image}
            alt={deviceName}
            className="relative h-full w-full object-contain p-2 drop-shadow-[0_24px_34px_rgba(2,6,23,0.38)] transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="relative text-base font-black tracking-wide text-cyan-100/58 sm:text-lg">
            {device.short || "LT"}
          </span>
        )}
      </div>

      <div className="relative mt-3 min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-cyan-50/78 ring-1 ring-cyan-200/12">
            New {rank}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-100/42">
            Latest
          </span>
        </div>
        <p className="line-clamp-1 text-sm font-black leading-snug text-white sm:text-[15px]">
          {deviceName}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-cyan-100/58">
          {device.brand || "Smartphone"}
        </p>
      </div>

      <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-white/8 pt-2.5">
        <span className="text-xs font-bold text-blue-100/68">
          View details
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-r from-cyan-400/20 to-fuchsia-400/20 text-cyan-100 transition group-hover:from-cyan-400/30 group-hover:to-fuchsia-400/30 group-hover:text-white">
          <FaArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
};

const LatestSmartphones = () => {
  const [currentDevices, setCurrentDevices] = useState([]);
  const [loadingLatest, setLoadingLatest] = useState(false);
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();

  useEffect(() => {
    let cancelled = false;
    const fetchLatest = async () => {
      setLoadingLatest(true);
      setCurrentDevices([]);
      const latestEndpoint = "/api/public/new/smartphones";

      try {
        const latestRes = await fetch(`${API_BASE}${latestEndpoint}`);
        if (!latestRes.ok)
          throw new Error("Failed to fetch latest smartphones");
        const latestJson = await latestRes.json();
        if (cancelled) return;

        const rows = getLatestRows(latestJson);
        const releasedRows = rows.filter(isReleasedRow);
        const mapped = releasedRows.slice(0, 12).map((row, index) => ({
          id:
            row.product_id ??
            row.productId ??
            row.id ??
            row.basic_info?.id ??
            null,
          name: getRowName(row),
          brand: getRowBrand(row),
          image: getRowImage(row),
          short: getShortLabel(getRowName(row), getRowBrand(row)),
          _rowIndex: index,
        }));

        setCurrentDevices(mapped);
      } catch (err) {
        console.error("Failed to load latest smartphones:", err);
        setCurrentDevices([]);
      } finally {
        if (!cancelled) setLoadingLatest(false);
      }
    };

    fetchLatest();
    return () => {
      cancelled = true;
    };
  }, []);

  const getDevicePath = (device) => {
    const rawName = device.name || String(device.id || "device");
    return createProductPath("smartphones", rawName);
  };

  const handleDeviceClick = (device) => {
    navigate(getDevicePath(device));
  };

  return (
    <section
      className={`relative overflow-hidden bg-[#050712] text-white transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#073C8C_0%,#24105E_34%,#0B1547_62%,#073C8C_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(34,211,238,0.26),transparent_31%),radial-gradient(circle_at_82%_16%,rgba(217,70,239,0.26),transparent_34%),radial-gradient(circle_at_52%_86%,rgba(59,130,246,0.2),transparent_42%)]" />
      <div className="absolute left-[-28%] top-[4%] h-24 w-[22rem] -rotate-12 rounded-[999px] bg-gradient-to-r from-cyan-400/14 via-blue-500/20 to-fuchsia-500/18 blur-2xl sm:left-[-18%] sm:top-[8%] sm:h-32 sm:w-[58rem]" />
      <div className="absolute right-[-42%] bottom-[12%] h-28 w-[24rem] rotate-12 rounded-[999px] bg-gradient-to-r from-purple-600/18 via-blue-500/16 to-sky-400/12 blur-2xl sm:right-[-22%] sm:h-40 sm:w-[54rem]" />
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full mix-blend-screen sm:block sm:opacity-65 lg:opacity-70"
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="latestTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="46%" stopColor="#60A5FA" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M-90 138H180C246 138 252 220 318 220H506C586 220 594 98 674 98H832C918 98 936 202 1018 202H1530"
          stroke="url(#latestTrace)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M-80 438H198C262 438 288 360 356 360H568C638 360 662 474 736 474H950C1034 474 1056 388 1138 388H1520"
          stroke="url(#latestTrace)"
          strokeWidth="2"
          fill="none"
        />
      </svg>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-45 mix-blend-screen sm:hidden"
        viewBox="0 0 390 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="latestMobileTrace" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0" />
            <stop offset="48%" stopColor="#60A5FA" stopOpacity="0.48" />
            <stop offset="100%" stopColor="#D946EF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M-34 122H72C110 122 116 184 154 184H248C292 184 298 120 342 120H426"
          stroke="url(#latestMobileTrace)"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M-36 522H78C118 522 128 454 168 454H250C292 454 302 566 344 566H426"
          stroke="url(#latestMobileTrace)"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M72 122V82H148M248 184V232H330M168 454V404H236M344 566V620H382"
          stroke="rgba(191,219,254,0.2)"
          strokeWidth="1.3"
          fill="none"
        />
        <circle cx="72" cy="122" r="4" fill="#BAE6FD" opacity="0.4" />
        <circle cx="154" cy="184" r="4" fill="#BAE6FD" opacity="0.4" />
        <circle cx="248" cy="184" r="4" fill="#BAE6FD" opacity="0.34" />
        <circle cx="168" cy="454" r="4" fill="#BAE6FD" opacity="0.36" />
        <circle cx="344" cy="566" r="4" fill="#BAE6FD" opacity="0.36" />
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/45 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-md border border-cyan-200/20 bg-blue-500/12 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-blue-100 shadow-[0_0_32px_rgba(14,165,233,0.14)] backdrop-blur sm:text-[11px]">
              <FaMobileAlt className="h-3 w-3 text-sky-300" />
              Latest Smartphones
            </p>

            <h2 className="mt-5 text-[2rem] font-black leading-[1.02] text-white sm:text-4xl lg:text-5xl">
              New phones
              <span className="block bg-gradient-to-r from-sky-200 via-white to-fuchsia-200 bg-clip-text text-transparent">
                landing on Hooks.
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-100/70 sm:text-base sm:leading-7">
              Freshly released smartphones from the live catalog, ready to
              open, compare, and shortlist.
            </p>
          </div>

          <Link
            to="/smartphones/filter/new"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-cyan-200/18 bg-cyan-300/10 px-4 py-2.5 text-xs font-bold text-cyan-50/82 transition hover:border-fuchsia-200/30 hover:bg-fuchsia-400/12 hover:text-white"
          >
            View all latest
            <FaArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-8 flex items-center gap-4 sm:mt-10">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-200/44 to-transparent" />
          <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/58 sm:text-xs">
            Fresh Launch Lane
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-200/36 to-transparent" />
        </div>

        {loadingLatest ? null : currentDevices.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-blue-100/70">
              No released smartphones available right now.
            </p>
          </div>
        ) : null}

        <div className="no-scrollbar mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 pr-8 sm:gap-4 sm:pr-12">
          {loadingLatest
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className={`flex min-w-[15.25rem] shrink-0 flex-col overflow-hidden rounded-lg border border-cyan-200/12 bg-white/[0.055] p-2.5 text-cyan-50 backdrop-blur-xl transition-all duration-300 sm:min-w-[16rem] sm:p-3 ${
                    isLoaded
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  } animate-pulse`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="relative flex h-[8.5rem] w-full items-center justify-center overflow-visible sm:h-36">
                    <span className="absolute bottom-3 h-10 w-24 rounded-full bg-cyan-100/12 blur-2xl" />
                    <div className="h-12 w-12 rounded-full bg-white/10" />
                  </div>

                  <div className="mt-3 flex-1">
                    <div className="h-3 w-4/5 rounded bg-white/15" />
                    <div className="mt-2 h-2 w-16 rounded bg-white/10" />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
                    <div className="h-2.5 w-20 rounded bg-white/15" />
                    <div className="h-3 w-3 rounded-full bg-white/15 sm:h-3.5 sm:w-3.5" />
                  </div>
                </div>
              ))
            : currentDevices.map((device, i) => (
                <LatestSmartphoneCard
                  key={`${device.id || "noid"}-${i}`}
                  device={device}
                  index={i}
                  isLoaded={isLoaded}
                  onClick={() => handleDeviceClick(device)}
                />
              ))}
        </div>

        {/* View All Link */}
      </div>
    </section>
  );
};

export default LatestSmartphones;
