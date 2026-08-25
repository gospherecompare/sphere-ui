import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaMobileAlt,
} from "react-icons/fa";
import {
  buildCanonicalComparePath,
  toCanonicalCompareSlug,
} from "../../utils/compareRoutes";
import { readPreloadedApiResponse } from "../../utils/preloadedApi";
import { API_ORIGIN_URL, buildApiUrl } from "../../utils/apiUrl";
import { fetchPublicJson } from "../../utils/publicJsonRequest";

const normalizeText = (value) => String(value || "").trim();

const normalizeAssetUrl = (value) => {
  const raw = normalizeText(value);
  if (!raw) return "";
  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("/")) return `${API_ORIGIN_URL}${raw}`;
  if (/^(uploads|assets|images)\//i.test(raw)) {
    return `${API_ORIGIN_URL}/${raw.replace(/^\/+/, "")}`;
  }
  return raw;
};

const isSmartphoneType = (value) =>
  /(smartphone|smart phone|mobile|phone)/i.test(normalizeText(value));

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

const buildComparePath = (item) =>
  buildCanonicalComparePath({
    leftName: item.leftName,
    rightName: item.rightName,
    leftId: item.leftId,
    rightId: item.rightId,
    type: "smartphone",
  });

const makeComparisonKey = (item) => {
  const idPair =
    item.leftId && item.rightId
      ? [String(item.leftId), String(item.rightId)].sort()
      : [
          toCanonicalCompareSlug(item.leftName),
          toCanonicalCompareSlug(item.rightName),
        ].sort();
  return idPair.join("|");
};

const MOST_COMPARED_ENDPOINT = buildApiUrl("/public/trending/most-compared");

const mapRemoteComparisonsPayload = (json) => {
  const rows = Array.isArray(json?.mostCompared) ? json.mostCompared : [];
  return rows
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
};

const buildLocalComparisons = (devices = []) => {
  const uniqueDevices = [];
  const seen = new Set();

  for (const device of Array.isArray(devices) ? devices : []) {
    const name = getDeviceName(device);
    if (!name) continue;
    const productId = getDeviceProductId(device);
    const key = productId
      ? `id:${productId}`
      : `name:${toCanonicalCompareSlug(name)}`;
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

  for (let index = 0; index < candidates.length - 1; index += 2) {
    addPair(candidates[index], candidates[index + 1]);
  }

  for (
    let index = 0;
    pairs.length < 8 && index < candidates.length - 1;
    index += 1
  ) {
    addPair(candidates[index], candidates[index + 1]);
  }

  return pairs;
};

const PhoneVisual = ({ src = "", label = "" }) => {
  const [failed, setFailed] = useState(false);
  const imageSrc = normalizeAssetUrl(src);

  useEffect(() => {
    setFailed(false);
  }, [imageSrc]);

  return (
    <div className="flex h-36 min-w-0 items-center justify-center sm:h-40 xl:h-44">
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label || "Smartphone"}
          loading="lazy"
          className="h-full w-full scale-[1.06] object-contain transition-transform duration-300 group-hover:scale-[1.1]"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid h-20 w-14 place-items-center rounded-lg bg-white/80 text-blue-300">
          <FaMobileAlt className="text-3xl" />
        </div>
      )}
    </div>
  );
};

const PopularMobileComparisonsStrip = ({ devices = [], className = "" }) => {
  const scrollerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remoteComparisons, setRemoteComparisons] = useState(() =>
    mapRemoteComparisonsPayload(
      readPreloadedApiResponse(MOST_COMPARED_ENDPOINT),
    ),
  );

  useEffect(() => {
    const preloadedPayload = readPreloadedApiResponse(MOST_COMPARED_ENDPOINT);
    if (preloadedPayload) {
      setRemoteComparisons(mapRemoteComparisonsPayload(preloadedPayload));
      return undefined;
    }

    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    const loadComparisons = async () => {
      try {
        const json = await fetchPublicJson(MOST_COMPARED_ENDPOINT, {
          signal: controller?.signal,
        });
        if (!cancelled) {
          setRemoteComparisons(mapRemoteComparisonsPayload(json));
        }
      } catch (error) {
        if (error?.name !== "AbortError" && !cancelled) {
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

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(0, comparisons.length - 1)),
    );
  }, [comparisons.length]);

  if (comparisons.length === 0) return null;

  const getCards = () =>
    Array.from(
      scrollerRef.current?.querySelectorAll("[data-matchup-card]") || [],
    );

  const scrollToComparison = (index) => {
    const cards = getCards();
    const targetIndex = Math.min(Math.max(index, 0), cards.length - 1);
    const target = cards[targetIndex];
    if (!target) return;

    target.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
    setActiveIndex(targetIndex);
  };

  const handleScrollerScroll = () => {
    const viewport = scrollerRef.current;
    if (!viewport) return;
    const cards = getCards();
    if (!cards.length) return;

    const viewportLeft = viewport.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(
        card.getBoundingClientRect().left - viewportLeft,
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  };

  const dotCount = Math.min(comparisons.length, 5);
  const activeDot =
    dotCount <= 1
      ? 0
      : Math.round(
          (activeIndex / Math.max(1, comparisons.length - 1)) * (dotCount - 1),
        );

  return (
    <section
      className={`smartphones-matchups-section mx-auto w-full max-w-7xl bg-transparent py-6 text-slate-950 sm:py-8 dark:text-slate-100 ${className}`}
      aria-labelledby="popular-phone-comparisons-title"
    >
      <div className="mb-5 flex items-end justify-between gap-3 px-1 sm:mb-6">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-600 sm:text-xs dark:text-blue-400">
            Popular matchups
          </span>
          <h2
            id="popular-phone-comparisons-title"
            className="mt-1.5 max-w-3xl text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl dark:text-white"
          >
            Compare popular mobile phones
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base dark:text-slate-400">
            Pick a matchup and compare the details that matter.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/popular-comparisons"
            className="hidden min-h-10 items-center gap-2 rounded-lg bg-blue-50 px-4 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100 sm:inline-flex dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
          >
            View all
            <FaArrowRight className="text-[11px]" />
          </Link>
          <button
            type="button"
            onClick={() => scrollToComparison(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous phone comparison"
            className="grid h-10 w-10 place-items-center rounded-lg bg-white text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
          >
            <FaChevronLeft className="text-xs" />
          </button>
          <button
            type="button"
            onClick={() => scrollToComparison(activeIndex + 1)}
            disabled={activeIndex >= comparisons.length - 1}
            aria-label="Next phone comparison"
            className="grid h-10 w-10 place-items-center rounded-lg bg-white text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
          >
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={handleScrollerScroll}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {comparisons.map((item, index) => {
          const compareTitle = `${item.leftName} vs ${item.rightName}`;

          return (
            <Link
              key={`${makeComparisonKey(item)}-${index}`}
              data-matchup-card
              to={buildComparePath(item)}
              aria-label={`Compare ${item.leftName} with ${item.rightName}`}
              className="group w-[86vw] max-w-[390px] shrink-0 snap-start rounded-xl bg-transparent p-3 transition-colors hover:bg-blue-50/40 sm:w-[390px] sm:p-4 lg:w-[calc((100%_-_2rem)/3)] lg:min-w-[340px] dark:hover:bg-[#13243b]"
            >
              <div className="smartphones-product-stage relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-slate-50 px-3 pb-3 pt-4 dark:from-[#e7effb] dark:via-[#f8fbff] dark:to-[#dce7f5]">
                <span className="absolute left-4 top-3 text-[9px] font-extrabold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-700">
                  Matchup {index + 1}
                </span>
                <span className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-100/50 dark:bg-blue-200/60" />
                <span className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-indigo-100/40 dark:bg-indigo-200/50" />

                <div className="relative mt-4 grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-center gap-1 sm:grid-cols-[minmax(0,1fr)_48px_minmax(0,1fr)] sm:gap-2">
                  <PhoneVisual src={item.leftImage} label={item.leftName} />

                  <span className="grid h-10 w-10 place-items-center justify-self-center rounded-full bg-blue-600 text-[10px] font-black text-white sm:h-11 sm:w-11 sm:text-xs">
                    VS
                  </span>

                  <PhoneVisual src={item.rightImage} label={item.rightName} />
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <p className="truncate text-sm font-extrabold text-slate-900 sm:text-base dark:text-slate-100">
                  {item.leftName}
                </p>
                <p className="truncate text-right text-sm font-extrabold text-slate-900 sm:text-base dark:text-slate-100">
                  {item.rightName}
                </p>
              </div>

              <div className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white transition-colors group-hover:bg-blue-700 dark:bg-blue-500 dark:group-hover:bg-blue-400">
                <span className="min-w-0 truncate">Compare this matchup</span>
                <FaArrowRight className="shrink-0 text-[11px] transition-transform group-hover:translate-x-0.5" />
              </div>

              <p className="sr-only">{compareTitle}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: dotCount }, (_, index) => (
          <button
            key={`matchup-dot-${index}`}
            type="button"
            onClick={() => {
              const targetIndex =
                dotCount <= 1
                  ? 0
                  : Math.round(
                      (index / (dotCount - 1)) * (comparisons.length - 1),
                    );
              scrollToComparison(targetIndex);
            }}
            aria-label={`Go to comparison group ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              index === activeDot
                ? "w-6 bg-blue-600 dark:bg-blue-400"
                : "w-2 bg-slate-300 dark:bg-slate-600"
            }`}
          />
        ))}
      </div>

      <Link
        to="/popular-comparisons"
        className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-50 px-4 text-sm font-bold text-blue-700 sm:hidden dark:bg-blue-500/10 dark:text-blue-300"
      >
        View all comparisons
        <FaArrowRight className="text-[11px]" />
      </Link>
    </section>
  );
};

export default PopularMobileComparisonsStrip;
