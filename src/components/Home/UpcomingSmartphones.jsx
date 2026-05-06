// src/components/Home/UpcomingSmartphones.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaMobileAlt, FaArrowRight } from "react-icons/fa";
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

const LatestSmartphoneCard = ({ device, index, isLoaded, onClick }) => {
  const deviceName = device?.name || "Latest smartphone";

  return (
    <button
      type="button"
      aria-label={`Open ${deviceName}`}
      onClick={onClick}
      className={`group relative flex w-full snap-start flex-row items-center gap-4 rounded-3xl  p-4 text-left text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 sm:flex-col sm:items-stretch sm:p-6 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-blue-950/20 sm:h-44 sm:w-full">
        {device.image ? (
          <img
            src={device.image}
            alt={deviceName}
            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-110 sm:p-3"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <FaMobileAlt className="text-3xl text-slate-500 sm:text-4xl" />
        )}
      </div>

      <div className="flex flex-col justify-between">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-white sm:text-base">
          {deviceName}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/12 pt-2 sm:mt-3 sm:pt-3">
          <span className="text-xs font-medium text-slate-300">
            View Details
          </span>
          <span className="transition-transform duration-300 group-hover:translate-x-1">
            <FaArrowRight className="h-3 w-3 text-slate-300 sm:h-3.5 sm:w-3.5" />
          </span>
        </div>
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
          image: getRowImage(row),
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(103,232,249,0.14),_transparent_30%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        {/* Header Section */}
        <div className="mx-auto max-w-4xl text-center">
          <h1
            className={`${HOME_SECTION_TITLE_DARK} mx-auto max-w-[10.5ch] text-[2.45rem] tracking-[-0.04em] sm:max-w-none sm:text-5xl lg:text-6xl`}
          >
            <span className="block">Latest </span>
            <span className="bg-gradient-to-r from-white via-sky-100 to-cyan-200 bg-clip-text text-transparent animate-pulse">
              Smartphones
            </span>
          </h1>

          <p className={HOME_SECTION_LEAD_DARK}>
            Discover the newest released phones. Stay updated with the latest
          </p>
        </div>

        {/* Section Divider */}
        <div className="mt-14 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
          <span className="whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-white/80">
            Featured Latest
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        </div>

        {loadingLatest ? null : currentDevices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-white/70">
              No released smartphones available right now.
            </p>
          </div>
        ) : null}

        {/* Products Row - Single row horizontal scroll */}
        <div className="no-scrollbar mt-8 grid grid-flow-col auto-cols-[calc(100%-1rem)] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth sm:auto-cols-[calc(50%-0.5rem)] md:auto-cols-[calc(33.333%-0.67rem)] lg:auto-cols-[calc(25%-0.75rem)] xl:auto-cols-[calc(20%-0.6rem)]">
          {loadingLatest
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="w-full animate-pulse">
                  <div className="relative flex h-auto flex-row items-center gap-4 overflow-hidden rounded-3xl border border-white/12 bg-white/[0.08] p-4 backdrop-blur-md sm:flex-col sm:items-stretch sm:p-6">
                    <div className="h-24 w-24 shrink-0 rounded-2xl bg-blue-950/20 sm:h-44 sm:w-full" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-4/5 rounded bg-white/15" />
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="border-t border-white/10 pt-3">
                        <div className="h-3 w-24 rounded bg-white/15" />
                      </div>
                    </div>
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
        {!loadingLatest && currentDevices.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              to="/smartphones/latest"
              className="group rounded-full border border-white/15 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/25 hover:bg-white/15 hover:shadow-lg"
            >
              View all latest smartphones {"->"}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestSmartphones;
