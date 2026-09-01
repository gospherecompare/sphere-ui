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
} from "../utils/compareRoutes";
import { readPreloadedApiResponse } from "../utils/preloadedApi";
import { API_ORIGIN_URL, buildApiUrl } from "../utils/apiUrl";
import { fetchPublicJson } from "../utils/publicJsonRequest";
import SEO from "./SEO";

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
    <div className="flex h-28 min-w-0 items-center justify-center sm:h-32 xl:h-36">
      {imageSrc && !failed ? (
        <img
          src={imageSrc}
          alt={label || "Smartphone"}
          loading="lazy"
          className="h-full w-full scale-[1.03] object-contain transition-transform duration-300 group-hover:scale-[1.07]  "
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="grid h-16 w-12 place-items-center rounded-lg bg-blue-100/60 text-blue-400  ">
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
    <>
      <SEO
        title="Popular Smartphone Comparisons in India | MobilesX"
        description="Explore popular smartphone comparisons and compare specifications, features and important differences side by side."
        url="https://mobilesx.in/popular-comparisons"
      />
      <section
        className={`smartphones-matchups-section mx-auto w-full max-w-6xl bg-transparent py-4 text-slate-950 sm:py-6  ${className}`}
        aria-labelledby="popular-phone-comparisons-title"
      >
        <div className="mb-4 flex items-end justify-between gap-3 px-1 sm:mb-5">
          <div className="min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-blue-600 sm:text-xs ">
              Popular matchups
            </span>
            <h2
              id="popular-phone-comparisons-title"
              className="mt-1 max-w-3xl text-xl font-black tracking-[-0.035em] text-slate-950 sm:text-2xl "
            >
              Compare popular mobile phones
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm ">
              Pick a matchup and compare the details that matter.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/popular-comparisons"
              className="hidden min-h-9 items-center gap-2 rounded-lg bg-blue-50/70 px-3 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 sm:inline-flex   "
            >
              View all
              <FaArrowRight className="text-[11px]" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToComparison(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Previous phone comparison"
              className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50/70 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-30   "
            >
              <FaChevronLeft className="text-xs" />
            </button>
            <button
              type="button"
              onClick={() => scrollToComparison(activeIndex + 1)}
              disabled={activeIndex >= comparisons.length - 1}
              aria-label="Next phone comparison"
              className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50/70 text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-30   "
            >
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          onScroll={handleScrollerScroll}
          className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden"
        >
          {comparisons.map((item, index) => {
            const compareTitle = `${item.leftName} vs ${item.rightName}`;

            return (
              <Link
                key={`${makeComparisonKey(item)}-${index}`}
                to={buildComparePath(item)}
                aria-label={`Compare ${item.leftName} with ${item.rightName}`}
                className="group w-[75vw] max-w-[310px] shrink-0 snap-start rounded-xl bg-transparent p-1.5 transition-colors hover:bg-transparent sm:w-[310px] sm:p-2 lg:w-[calc((100%_-_1rem)/3)] lg:min-w-[270px]"
              >
                <div className="smartphones-product-stage relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50/80 via-slate-50/70 to-indigo-50/70 px-2 pb-2 pt-2.5 ">
                  <span className="absolute left-3 top-2.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-blue-600 ">
                    Matchup {index + 1}
                  </span>
                  <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/40 " />
                  <span className="absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-indigo-100/30 " />

                  <div className="relative mt-3 grid grid-cols-[minmax(0,1fr)_34px_minmax(0,1fr)] items-center gap-1 sm:grid-cols-[minmax(0,1fr)_38px_minmax(0,1fr)] sm:gap-1.5">
                    <PhoneVisual src={item.leftImage} label={item.leftName} />

                    <span className="grid h-8 w-8 place-items-center justify-self-center rounded-full bg-blue-600 text-[9px] font-black text-white sm:h-9 sm:w-9 sm:text-[10px]">
                      VS
                    </span>

                    <PhoneVisual src={item.rightImage} label={item.rightName} />
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <p className="truncate text-xs font-extrabold text-slate-900 sm:text-sm ">
                    {item.leftName}
                  </p>
                  <p className="truncate text-right text-xs font-extrabold text-slate-900 sm:text-sm ">
                    {item.rightName}
                  </p>
                </div>

                <div className="mt-3 flex min-h-9 items-center justify-between gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white transition-colors group-hover:bg-blue-700  ">
                  <span className="min-w-0 truncate">Compare this matchup</span>
                  <FaArrowRight className="shrink-0 text-[11px] transition-transform group-hover:translate-x-0.5" />
                </div>

                <p className="sr-only">{compareTitle}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5">
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
              className={`h-1.5 rounded-full transition-all ${
                index === activeDot
                  ? "w-6 bg-blue-600 "
                  : "w-2 bg-slate-300 "
              }`}
            />
          ))}
        </div>

        <Link
          to="/popular-comparisons"
          className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-50/70 px-3 text-xs font-bold text-blue-700 sm:hidden  "
        >
          View all comparisons
          <FaArrowRight className="text-[11px]" />
        </Link>
      </section>
    </>
  );
};

export default PopularMobileComparisonsStrip;
