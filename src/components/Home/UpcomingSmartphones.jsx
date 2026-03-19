// src/components/Home/UpcomingSmartphones.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createProductPath } from "../../utils/slugGenerator";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { FaMobileAlt } from "react-icons/fa";
import { resolveSmartphoneBadgeScore } from "../../utils/smartphoneBadgeScore";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");

const TrendSpecScoreBadge = ({ score }) => {
  const value = Number.isFinite(Number(score)) ? Number(score) : null;
  const label = value != null ? `${value.toFixed(1)}%` : "--";
  return (
    <div className="inline-flex flex-col items-center justify-center rounded-md border border-violet-200 bg-violet-50/95 px-1.5 py-1 leading-none">
      <span className="text-[10px] font-bold text-violet-700">{label}</span>
      <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-wide text-violet-600">
        Spec
      </span>
    </div>
  );
};

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

const getSmartphoneRows = (json) => {
  if (Array.isArray(json?.smartphones)) return json.smartphones;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.rows)) return json.rows;
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
      const smartphonesEndpoint = "/api/smartphones";

      try {
        const [trendingRes, smartphonesRes] = await Promise.all([
          fetch(`${API_BASE}${trendingEndpoint}`),
          fetch(`${API_BASE}${smartphonesEndpoint}`),
        ]);
        if (!trendingRes.ok)
          throw new Error("Failed to fetch upcoming smartphones");
        const trendingJson = await trendingRes.json();
        const smartphonesJson = smartphonesRes.ok
          ? await smartphonesRes.json()
          : null;
        if (cancelled) return;

        const rows = getTrendingRows(trendingJson);
        const smartphoneRows = getSmartphoneRows(smartphonesJson);
        const scoreByProductId = new Map();
        for (const item of smartphoneRows) {
          const pid = item?.product_id ?? item?.id ?? null;
          if (pid == null) continue;
          const canonicalScore = resolveSmartphoneBadgeScore(item);
          if (!Number.isFinite(canonicalScore)) continue;
          scoreByProductId.set(String(pid), canonicalScore);
        }

        const upcomingRows = rows.filter(isUpcomingRow);
        const mapped = upcomingRows.map((row, index) => ({
          id:
            row.product_id ??
            row.productId ??
            row.id ??
            row.basic_info?.id ??
            null,
          name: getRowName(row),
          image: getRowImage(row),
          launchDate: getRowLaunchDate(row),
          launchLabel: formatUpcomingDate(getRowLaunchDate(row)),
          launch_status: firstText(row?.launch_status, row?.launchStatus),
          launchStatus: getRowLaunchStatus(row),
          status: firstText(row?.status, row?.availability, row?.badge),
          score:
            scoreByProductId.get(
              String(row?.product_id ?? row?.productId ?? row?.id ?? ""),
            ) ?? resolveSmartphoneBadgeScore(row),
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
    <div
      className={`px-2 lg:px-4 mx-auto bg-white max-w-4xl mb-5 w-full m-0 overflow-hidden pt-5 sm:pt-10 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Header Section */}
      <div className="mb-6 px-2">
        <div className="flex items-center justify-between gap-3 mb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Upcoming{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent font-bold">
              Smartphones
            </span>
          </h2>
          <Link
            to="/smartphones/upcoming"
            className="text-xs sm:text-sm font-semibold text-purple-700 hover:text-purple-900"
          >
            View all
          </Link>
        </div>
        <p className="text-sm text-gray-600">
          Keep track of devices expected to launch soon.
        </p>
      </div>

      {loadingUpcoming ? null : currentDevices.length === 0 ? (
        <div className="px-2 text-sm text-gray-500">
          No upcoming smartphones available right now.
        </div>
      ) : null}

      {/* Products Row - Horizontal scroll with fixed-size cards */}
      <div className="flex overflow-x-auto gap-4 lg:gap-5 hide-scrollbar no-scrollbar scroll-smooth pb-6">
        {loadingUpcoming
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="w-[220px] h-[200px] shrink-0 animate-pulse"
              >
                <div className="rounded-2xl bg-white p-3 shadow-sm">
                  <div className="bg-gray-200 rounded-xl w-full h-24 sm:h-32 lg:h-40 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-4/5"></div>
                  <div className="h-4 bg-gray-200 rounded mb-3 w-full"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2 w-2/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))
          : currentDevices.map((device, i) => (
              <div
                key={`${device.id || "noid"}-${i}`}
                onClick={() => handleDeviceClick(device)}
                className={`group shrink-0 cursor-pointer transition-all duration-500 ${
                  isLoaded
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2"
                }`}
                style={{ transitionDelay: `${i * 45}ms` }}
              >
                <div className="relative h-full w-32 rounded-lg overflow-hidden p-2 transition-all duration-200 group-hover:-translate-y-0.5">
                  <div className="flex h-full flex-col gap-2">
                    {/* Image */}
                    <div className="relative w-full flex-shrink-0">
                      {Number.isFinite(device.score) ? (
                        <div className="absolute left-1 top-1 z-10 pointer-events-none">
                          <TrendSpecScoreBadge score={device.score} />
                        </div>
                      ) : null}
                      <div className="mx-auto h-28 sm:h-32 w-28 rounded-md shadow-md  overflow-hidden bg-gray-100 flex items-center justify-center">
                        {device.image ? (
                          <img
                            src={device.image}
                            alt={device.name}
                            className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="text-center px-3">
                            <div className="mx-auto mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
                              <FaMobileAlt className="text-gray-400 text-sm" />
                            </div>
                            <span className="text-[11px] text-gray-500">
                              No image
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <h6 className="mt-1 text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-purple-600 transition-colors duration-200">
                        <Link
                          to={getDevicePath(device)}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex"
                        >
                          {device.name}
                        </Link>
                      </h6>
                      {device.launchLabel || device.launchStatus ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          {device.launchLabel ? (
                            <span>Expected {device.launchLabel}</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default UpcomingSmartphones;
