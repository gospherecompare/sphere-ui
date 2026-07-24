// src/components/Home/LatestSmartphones.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaArrowRight, FaMobileAlt } from "react-icons/fa";
import { buildApiUrl } from "../../utils/apiUrl";
import { fetchPublicJson } from "../../utils/publicJsonRequest";

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
      className={`group relative flex min-w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-lg border border-cyan-200/14 bg-white/[0.055] p-3 text-left text-white shadow-[0_16px_42px_rgba(2,6,23,0.14)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/28 hover:bg-white/[0.075] sm:min-w-[16.75rem] sm:p-3.5 lg:min-w-[18rem] ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.18),transparent_36%)] opacity-90" />
      <span className="pointer-events-none absolute -right-6 top-12 text-8xl font-black leading-none text-white/[0.035] transition-transform duration-300 group-hover:scale-110">
        {rank}
      </span>
      <div className="relative z-10 flex h-32 w-full items-center justify-center overflow-visible sm:h-36 lg:h-40">
        <span className="absolute bottom-3 h-10 w-24 rounded-full bg-cyan-100/12 blur-2xl" />
        <span className="absolute h-28 w-28 rounded-full bg-gradient-to-br from-cyan-300/10 via-blue-500/8 to-fuchsia-400/10 blur-2xl" />
        {device.image && !imageFailed ? (
          <img
            src={device.image}
            alt={deviceName}
            className="relative h-full w-full object-contain p-1 drop-shadow-[0_24px_34px_rgba(2,6,23,0.4)] transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="relative text-base font-black tracking-wide text-cyan-100/58 sm:text-lg">
            {device.short || "LT"}
          </span>
        )}
      </div>

      <div className="relative z-10 mt-3 min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-100">
            New {rank}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/46">
            Latest
          </span>
        </div>
        <p className="line-clamp-2 text-base font-black leading-snug text-white">
          {deviceName}
        </p>
        <p className="mt-1 truncate text-xs font-semibold text-cyan-100/58">
          {device.brand || "Smartphone"}
        </p>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-cyan-100/10 pt-3">
        <span className="text-sm font-black text-white">View details</span>
        <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-cyan-400/80 to-fuchsia-500/80 text-white transition-transform duration-300 group-hover:translate-x-1">
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
      const latestEndpoint = "/public/new/smartphones";

      try {
        const latestJson = await fetchPublicJson(
          buildApiUrl(latestEndpoint),
        );
        if (cancelled) return;

        const rows = getLatestRows(latestJson);
        const mapped = rows.slice(0, 12).map((row, index) => ({
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
      className={`relative -mt-px overflow-hidden bg-[#050712] text-white transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-70 sm:block"
        viewBox="0 0 1440 560"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-40 138H210c96 0 102-118 192-118h260c100 0 98 154 208 154h620"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="3"
        />
        <path
          d="M910 102h214c84 0 86 96 166 96h190"
          fill="none"
          stroke="rgba(216,180,254,0.16)"
          strokeWidth="3"
        />
        <path
          d="M-24 438h246c92 0 100-138 190-138h300c106 0 118 148 230 148h542"
          fill="none"
          stroke="rgba(56,189,248,0.14)"
          strokeWidth="3"
        />
        <rect
          x="1006"
          y="206"
          width="210"
          height="118"
          rx="28"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="3"
        />
        <rect
          x="208"
          y="332"
          width="164"
          height="94"
          rx="26"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="3"
        />
      </svg>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-65 sm:hidden"
        viewBox="0 0 390 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          d="M-34 122H112c60 0 58 82 116 82h196"
          fill="none"
          stroke="rgba(125,211,252,0.18)"
          strokeWidth="2"
        />
        <path
          d="M52 342h108c45 0 44 68 90 68h176"
          fill="none"
          stroke="rgba(216,180,254,0.15)"
          strokeWidth="2"
        />
        <path
          d="M-20 600h120c52 0 52-76 104-76h214"
          fill="none"
          stroke="rgba(56,189,248,0.12)"
          strokeWidth="2"
        />
        <rect
          x="282"
          y="252"
          width="78"
          height="116"
          rx="20"
          fill="none"
          stroke="rgba(125,211,252,0.13)"
          strokeWidth="2"
        />
        <rect
          x="22"
          y="488"
          width="94"
          height="146"
          rx="22"
          fill="none"
          stroke="rgba(216,180,254,0.12)"
          strokeWidth="2"
        />
        <circle cx="112" cy="122" r="4" fill="rgba(103,232,249,0.55)" />
        <circle cx="250" cy="410" r="4" fill="rgba(216,180,254,0.5)" />
      </svg>
      <div className="pointer-events-none absolute left-[-7rem] top-12 hidden h-80 w-80 rounded-full border border-cyan-300/12 sm:block" />
      <div className="pointer-events-none absolute right-[-8rem] bottom-8 hidden h-80 w-80 rounded-full border border-fuchsia-300/14 sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px bg-gradient-to-r from-transparent via-cyan-300/18 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#050712]/32 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#050712]/32 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-7 lg:px-8 lg:pb-20 lg:pt-9">
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
              Freshly released smartphones from the live catalog, ready to open,
              compare, and shortlist.
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
          <span className="whitespace-nowrap rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100/70 sm:tracking-[0.28em]">
            Fresh Launch Lane
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-fuchsia-200/36 to-transparent" />
        </div>

        {loadingLatest ? null : currentDevices.length === 0 ? (
          <div className="mt-8 rounded-lg border border-cyan-200/14 bg-white/[0.055] px-6 py-8 text-center text-sm font-semibold text-cyan-50/70">
            <p className="text-sm font-semibold text-cyan-50/70">
              No latest smartphones available right now.
            </p>
          </div>
        ) : null}

        <div className="no-scrollbar mt-6 flex snap-x snap-mandatory items-stretch gap-4 overflow-x-auto pb-2 pr-8 sm:gap-4 sm:pr-12">
          {loadingLatest
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className={`relative flex min-w-[15.5rem] shrink-0 flex-col overflow-hidden rounded-lg border border-cyan-200/12 bg-white/[0.055] p-3 text-cyan-50 transition-all duration-300 animate-pulse sm:min-w-[16.75rem] sm:p-3.5 lg:min-w-[18rem] ${
                    isLoaded
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                  style={{ transitionDelay: `${i * 60}ms` }}
                >
                  <div className="relative mt-4 flex h-32 w-full items-center justify-center overflow-visible sm:h-36 lg:h-40">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_12%,rgba(56,189,248,0.08),transparent_32%),radial-gradient(circle_at_86%_28%,rgba(168,85,247,0.1),transparent_36%)] opacity-90" />
                    <span className="absolute bottom-3 h-10 w-24 rounded-full bg-cyan-100/12 blur-2xl" />
                    <div className="h-12 w-12 rounded-full bg-white/10" />
                  </div>

                  <div className="relative z-10 mt-3 flex-1">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="h-7 w-20 rounded-md bg-white/10" />
                      <div className="h-6 w-10 rounded-md bg-white/10" />
                    </div>
                    <div className="h-3 w-4/5 rounded bg-white/15" />
                    <div className="mt-2 h-2 w-16 rounded bg-white/10" />
                  </div>

                  <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-cyan-100/10 pt-3">
                    <div className="h-2.5 w-20 rounded bg-white/15" />
                    <div className="h-8 w-8 rounded-md bg-white/10" />
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
