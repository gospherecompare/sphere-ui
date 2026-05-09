// src/components/Home/UpcomingSmartphones.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaArrowRight } from "react-icons/fa";
import {
  HOME_SECTION_LEAD_DARK,
  HOME_SECTION_TITLE_DARK,
} from "./homeSectionTypography";

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

  return (
    <button
      type="button"
      aria-label={`Open ${deviceName}`}
      onClick={onClick}
      className={`group relative flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-left text-white backdrop-blur-lg transition-all duration-300 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="flex h-32 w-full sm:h-40 lg:h-44 items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-sky-300/20 bg-blue-950/40">
        {device.image && !imageFailed ? (
          <img
            src={device.image}
            alt={deviceName}
            className="h-full w-full object-contain p-2 sm:p-3 transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-base sm:text-lg font-bold tracking-wide text-slate-500">
            {device.short || "LT"}
          </span>
        )}
      </div>

      <div className="flex-1">
        <p className="line-clamp-2 text-xs sm:text-sm font-bold leading-snug text-white">
          {deviceName}
        </p>
        <p className="mt-0.5 text-[10px] sm:text-xs font-medium text-sky-200/70">
          {device.brand || "Smartphone"}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-sky-300/20 pt-2.5 sm:pt-3">
        <span className="text-[10px] sm:text-xs font-semibold text-sky-200">
          View Details
        </span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3.5 text-sky-200" />
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
      className={`relative overflow-hidden border-t border-sky-900/60 bg-gradient-to-b from-[#030b19] via-[#0a2f6d] to-[#030b19] transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.28),_transparent_30%),radial-gradient(circle_at_75%_18%,_rgba(56,189,248,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.18),_transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(186,230,253,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(186,230,253,0.07)_1px,transparent_1px)] [background-size:34px_34px] [mask-image:radial-gradient(circle_at_center,white,transparent_88%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-sky-950/20 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        {/* Header Section */}
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-[20px] font-bold uppercase tracking-[0.32em] text-sky-400 sm:text-xs">
            Latest Smartphones
          </h1>

          <p className={HOME_SECTION_LEAD_DARK}>
            Discover the latest smartphones that have just hit the market.
            Explore their features, specifications, and prices to find the
            perfect device for you.
          </p>
        </div>

        {/* Section Divider */}
        <div className="mt-14 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent" />
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-white/80">
            Featured Latest
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-200/50 to-transparent" />
        </div>

        {loadingLatest ? null : currentDevices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-white/70">
              No released smartphones available right now.
            </p>
          </div>
        ) : null}

        {/* Products Row - Single row horizontal scroll */}
        <div className="no-scrollbar mt-8 flex items-center gap-3 overflow-x-auto pb-2 sm:gap-4 md:gap-5">
          {loadingLatest
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className={`flex min-w-[160px] sm:min-w-[180px] md:min-w-[200px] shrink-0 flex-col gap-2.5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-slate-100 backdrop-blur-lg transition-all duration-300 ${
                    isLoaded
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  } animate-pulse`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl border border-sky-300/20 bg-blue-950/40 sm:h-40 lg:h-44">
                    <div className="h-12 w-12 rounded bg-white/10" />
                  </div>

                  <div className="flex-1">
                    <div className="h-3 w-4/5 rounded bg-white/15" />
                    <div className="mt-2 h-2 w-16 rounded bg-white/10" />
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-sky-300/20 pt-2.5 sm:pt-3">
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
