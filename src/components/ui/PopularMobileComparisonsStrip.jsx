import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaChevronLeft,
  FaChevronRight,
  FaMobileAlt,
} from "react-icons/fa";
import { generateSlug } from "../../utils/slugGenerator";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in"
).replace(/\/$/, "");

const normalizeText = (value) => String(value || "").trim();

const normalizeAssetUrl = (value) => {
  const raw = normalizeText(value);
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${API_BASE}${raw}`;
  if (/^(uploads|assets|images)\//i.test(raw)) {
    return `${API_BASE}/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
};

const isSmartphoneType = (value) =>
  /(smartphone|smart phone|mobile|phone)/i.test(normalizeText(value));

const toCompareSlug = (value) =>
  generateSlug(normalizeText(value)).replace(/-price-in-india$/i, "");

const getDeviceProductId = (device) => {
  const raw =
    device?.productId ??
    device?.product_id ??
    device?.baseId ??
    device?.base_id ??
    null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const getDeviceName = (device) =>
  normalizeText(device?.name || device?.model || device?.title);

const getDeviceImage = (device) =>
  normalizeAssetUrl(
    (Array.isArray(device?.images) ? device.images[0] : "") ||
      device?.image ||
      device?.image_url ||
      device?.product_image,
  );

const buildComparePath = (item) => {
  const leftId = Number(item.leftId);
  const rightId = Number(item.rightId);
  if (
    Number.isFinite(leftId) &&
    leftId > 0 &&
    Number.isFinite(rightId) &&
    rightId > 0
  ) {
    return `/compare?devices=${leftId}:0,${rightId}:0&type=smartphone`;
  }

  const leftSlug = toCompareSlug(item.leftName);
  const rightSlug = toCompareSlug(item.rightName);
  if (leftSlug && rightSlug && leftSlug !== rightSlug) {
    return `/compare/${leftSlug}-vs-${rightSlug}`;
  }

  return "/compare";
};

const makeComparisonKey = (item) => {
  const idPair =
    item.leftId && item.rightId
      ? [String(item.leftId), String(item.rightId)].sort()
      : [toCompareSlug(item.leftName), toCompareSlug(item.rightName)].sort();
  return idPair.join("|");
};

const buildLocalComparisons = (devices = []) => {
  const uniqueDevices = [];
  const seen = new Set();

  for (const device of Array.isArray(devices) ? devices : []) {
    const name = getDeviceName(device);
    if (!name) continue;
    const productId = getDeviceProductId(device);
    const key = productId ? `id:${productId}` : `name:${toCompareSlug(name)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueDevices.push({
      id: productId,
      name,
      image: getDeviceImage(device),
    });
  }

  const candidates = uniqueDevices.slice(0, 12);
  const pairs = [];
  const addPair = (left, right) => {
    if (!left || !right || left.name === right.name) return;
    pairs.push({
      leftId: left.id,
      leftName: left.name,
      leftImage: left.image,
      rightId: right.id,
      rightName: right.name,
      rightImage: right.image,
      compareCount: 0,
      source: "local",
    });
  };

  for (let i = 0; i < candidates.length - 1; i += 2) {
    addPair(candidates[i], candidates[i + 1]);
  }

  for (let i = 0; pairs.length < 8 && i < candidates.length - 1; i += 1) {
    addPair(candidates[i], candidates[i + 1]);
  }

  return pairs;
};

const ComparisonPhoneVisual = ({ src = "", label = "" }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeAssetUrl(src);

  return (
    <div className="flex h-[118px] w-full items-center justify-center rounded-lg border border-blue-100 bg-blue-50/40 p-2 sm:h-[132px]">
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label || "Phone"}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-md bg-white text-blue-300">
          <FaMobileAlt className="text-2xl" />
        </div>
      )}
    </div>
  );
};

const PopularMobileComparisonsStrip = ({ devices = [], className = "" }) => {
  const scrollerRef = useRef(null);
  const [remoteComparisons, setRemoteComparisons] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    const loadComparisons = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/public/trending/most-compared`,
          controller ? { signal: controller.signal } : undefined,
        );
        if (!response.ok) return;
        const json = await response.json();
        if (cancelled) return;

        const rows = Array.isArray(json?.mostCompared)
          ? json.mostCompared
          : [];
        const mapped = rows
          .filter(
            (row) =>
              isSmartphoneType(row?.product_type) &&
              isSmartphoneType(row?.compared_product_type),
          )
          .map((row) => ({
            leftId: row.product_id,
            leftName: normalizeText(row.product_name),
            leftImage: normalizeAssetUrl(row.product_image),
            rightId: row.compared_product_id,
            rightName: normalizeText(row.compared_product_name),
            rightImage: normalizeAssetUrl(row.compared_product_image),
            compareCount: Number(row.compare_count) || 0,
            source: "remote",
          }))
          .filter((item) => item.leftName && item.rightName);

        setRemoteComparisons(mapped);
      } catch (err) {
        if (err?.name !== "AbortError" && !cancelled) {
          setRemoteComparisons([]);
        }
      }
    };

    loadComparisons();
    return () => {
      cancelled = true;
      controller?.abort?.();
    };
  }, []);

  const localComparisons = useMemo(
    () => buildLocalComparisons(devices),
    [devices],
  );

  const comparisons = useMemo(() => {
    const seen = new Set();
    return [...remoteComparisons, ...localComparisons]
      .filter((item) => {
        const key = makeComparisonKey(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }, [localComparisons, remoteComparisons]);

  if (comparisons.length === 0) return null;

  const scrollComparisons = (direction) => {
    scrollerRef.current?.scrollBy({
      left: direction * 340,
      behavior: "smooth",
    });
  };

  return (
    <section
      className={`mx-auto w-full max-w-7xl overflow-hidden rounded-lg border border-blue-100 bg-transparent px-4 py-5 sm:px-5 sm:py-6 ${className}`}
    >
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-blue-100 pb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-600">
            Popular Matchups
          </p>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Compare Popular Mobile Phones in India
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
            Explore popular phone matchups and compare key choices side by side.
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollComparisons(-1)}
            aria-label="Scroll comparisons left"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <FaChevronLeft className="text-sm" />
          </button>
          <button
            type="button"
            onClick={() => scrollComparisons(1)}
            aria-label="Scroll comparisons right"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <FaChevronRight className="text-sm" />
          </button>
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollComparisons(-1)}
          aria-label="Scroll comparisons left"
          className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 md:flex"
        >
          <FaChevronLeft className="text-sm" />
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {comparisons.map((item, index) => {
            const compareTitle = `${item.leftName} vs ${item.rightName}`;

            return (
              <Link
                key={`${makeComparisonKey(item)}-${index}`}
                to={buildComparePath(item)}
                className="group w-[292px] shrink-0 rounded-lg border border-blue-100 bg-white p-3 text-slate-900 transition-colors duration-200 hover:border-blue-200 hover:bg-blue-50 sm:w-[315px]"
              >
                <div className="grid grid-cols-[minmax(0,1fr)_38px_minmax(0,1fr)] items-center gap-2">
                  <ComparisonPhoneVisual
                    src={item.leftImage}
                    label={item.leftName}
                  />
                  <div className="flex justify-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700">
                      VS
                    </span>
                  </div>
                  <ComparisonPhoneVisual
                    src={item.rightImage}
                    label={item.rightName}
                  />
                </div>

                <div className="mt-3 grid grid-cols-[minmax(0,1fr)_38px_minmax(0,1fr)] gap-2">
                  <p className="min-h-[40px] text-[13px] font-medium leading-5 text-slate-700 line-clamp-2">
                    {item.leftName}
                  </p>
                  <span aria-hidden="true" />
                  <p className="min-h-[40px] text-[13px] font-medium leading-5 text-slate-700 line-clamp-2">
                    {item.rightName}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-center rounded-md border border-blue-600 px-3 py-2 text-center text-[12px] font-semibold leading-5 text-blue-700 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <span className="truncate">{compareTitle}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollComparisons(1)}
          aria-label="Scroll comparisons right"
          className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 md:flex"
        >
          <FaChevronRight className="text-sm" />
        </button>
      </div>
    </section>
  );
};

export default PopularMobileComparisonsStrip;
