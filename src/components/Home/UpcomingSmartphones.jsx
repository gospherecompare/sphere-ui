// src/components/Home/UpcomingSmartphones.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaMobileAlt, FaArrowRight } from "react-icons/fa";

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
      className={`group relative flex w-full snap-start flex-col gap-3 rounded-3xl backdrop-blur-md p-5 text-left text-white/95 transition-all duration-300 hover:shadow-lg sm:p-6 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
    >
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-br from-white/10 to-white/5 ring-1 ring-white/30 backdrop-blur-md sm:h-44">
        {device.image ? (
          <img
            src={device.image}
            alt={deviceName}
            className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-110 sm:p-4"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <FaMobileAlt className="text-3xl text-white/40 sm:text-4xl" />
        )}
      </div>

      <div className="flex-1">
        <p className="line-clamp-2 text-base font-bold leading-snug text-white sm:text-lg">
          {deviceName}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-white/15 pt-3">
        <span className="text-xs font-medium text-white/70 sm:text-sm">
          View Details
        </span>
        <span className="transition-transform duration-300 group-hover:translate-x-1">
          <FaArrowRight className="h-3.5 w-3.5 text-white/70 sm:h-4 sm:w-4" />
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
      className={`relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-indigo-950 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/20 blur-3xl animate-pulse" />
      <div
        className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-gradient-to-tl from-purple-600/25 to-pink-500/15 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/3 h-72 w-72 rounded-full bg-gradient-to-r from-indigo-600/20 to-transparent blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Animated accent circles */}
      <div
        className="absolute top-20 right-1/4 h-48 w-48 rounded-full border border-cyan-400/20 blur-sm animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-1/3 left-1/4 h-64 w-64 rounded-full border border-purple-400/15 blur-sm animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

      {/* Floating dots */}
      <div className="absolute top-1/4 left-10 h-3 w-3 rounded-full bg-cyan-400/60 blur-sm animate-float" />
      <div
        className="absolute top-1/3 right-1/3 h-2 w-2 rounded-full bg-blue-400/50 blur-sm animate-float"
        style={{ animationDelay: "0.5s" }}
      />
      <div className="absolute bottom-1/4 right-1/4 h-3 w-3 rounded-full bg-purple-400/50 blur-sm animate-float-slow" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-24">
        {/* Header Section */}
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-8 text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Latest{" "}
            <span className="bg-gradient-to-r from-cyan-200 via-white to-sky-100 bg-clip-text text-transparent animate-pulse">
              Smartphones
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-7 text-white/85 sm:mt-6 sm:text-xl sm:leading-8">
            Discover the newest released phones.
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

        {/* Products Row - Horizontal scroll with compact cards */}
        <div className="no-scrollbar mt-8 grid grid-flow-col auto-cols-[11.5rem] gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth sm:gap-4 sm:auto-cols-[calc(50%-0.5rem)] md:auto-cols-[calc(33.333%-0.67rem)] lg:auto-cols-[calc(20%-0.8rem)]">
          {loadingLatest
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="w-full animate-pulse">
                  <div className="relative flex h-auto flex-col gap-3 overflow-hidden rounded-3xl backdrop-blur-md p-5 sm:p-6">
                    <div className="h-40 w-full rounded-2xl bg-white/20 sm:h-44" />
                    <div className="h-4 bg-white/20 rounded w-4/5" />
                    <div className="h-4 bg-white/20 rounded w-3/4" />
                    <div className="border-t border-white/15 pt-3">
                      <div className="h-3 bg-white/20 rounded w-24" />
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
              className="group rounded-full border border-white/25 bg-white/8 px-6 py-3 text-white/95 backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/15 hover:shadow-lg font-semibold"
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
