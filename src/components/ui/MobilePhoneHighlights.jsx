import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBatteryFull,
  FaCalendarAlt,
  FaCamera,
  FaChevronRight,
  FaFireAlt,
  FaGamepad,
  FaMobileAlt,
  FaRocket,
  FaStar,
  FaTag,
  FaTrophy,
} from "react-icons/fa";
import { createProductPath } from "../../utils/slugGenerator";
import {
  buildSmartphoneFeaturePath,
  buildSmartphoneFilterPath,
} from "../../utils/smartphoneListingRoutes";
import { API_ORIGIN_URL, buildApiUrl } from "../../utils/apiUrl";
import { fetchPublicJson } from "../../utils/publicJsonRequest";

const SMARTPHONE_HIGHLIGHTS_ENDPOINT = buildApiUrl(
  "/public/smartphones/highlights",
);
const SMARTPHONE_CATALOG_ENDPOINT = buildApiUrl("/smartphones");

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

const getLocalDateOnlyString = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const normalizeDateOnlyString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return getLocalDateOnlyString(value);
  const raw = String(value).trim();
  if (!raw) return null;
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const dmyMatch = raw.match(/^(\d{1,2})[\s/-](\d{1,2})[\s/-](\d{4})$/);
  if (dmyMatch) {
    const day = String(Number(dmyMatch[1])).padStart(2, "0");
    const month = String(Number(dmyMatch[2])).padStart(2, "0");
    return `${dmyMatch[3]}-${month}-${day}`;
  }
  return getLocalDateOnlyString(raw);
};

const parseDate = (value) => {
  const dateOnly = normalizeDateOnlyString(value);
  if (!dateOnly) return null;
  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatMonthYear = (value) => {
  const date = parseDate(value);
  if (!date) return "Date to be confirmed";
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
};

const getPhoneName = (device) =>
  normalizeText(device?.name || device?.model || device?.title);

const getPhoneKey = (device) => {
  const id =
    device?.productId ??
    device?.product_id ??
    device?.baseId ??
    device?.base_id ??
    null;
  if (id != null && String(id).trim()) return `id:${id}`;
  return `name:${getPhoneName(device).toLowerCase()}`;
};

const getPhoneImage = (device) => {
  const rawImages = Array.isArray(device?.images) ? device.images : [];
  const firstImage = rawImages.find(Boolean);
  return normalizeAssetUrl(
    firstImage ||
      device?.image ||
      device?.image_url ||
      device?.imageUrl ||
      device?.product_image ||
      device?.productImage ||
      device?.thumbnail,
  );
};

const getLaunchDateValue = (device) =>
  device?.launchDate ||
  device?.launch_date ||
  device?.saleStartDate ||
  device?.sale_start_date ||
  device?.createdAt ||
  device?.created_at ||
  null;

const getLaunchDate = (device) => parseDate(getLaunchDateValue(device));

const isFutureDate = (value) => {
  const dateOnly = normalizeDateOnlyString(value);
  const today = getLocalDateOnlyString();
  return Boolean(dateOnly && today && dateOnly > today);
};

const hasStoreRows = (device) => {
  const rows = [];
  if (Array.isArray(device?.store_prices)) rows.push(...device.store_prices);
  if (Array.isArray(device?.storePrices)) rows.push(...device.storePrices);
  for (const variant of Array.isArray(device?.variants)
    ? device.variants
    : []) {
    if (Array.isArray(variant?.store_prices))
      rows.push(...variant.store_prices);
    if (Array.isArray(variant?.storePrices)) rows.push(...variant.storePrices);
  }
  return rows.some((row) =>
    normalizeText(
      row?.store_name ||
        row?.storeName ||
        row?.store ||
        row?.url ||
        row?.price ||
        row?.sale_start_date ||
        row?.saleStartDate,
    ),
  );
};

const getSaleStartDate = (device) => {
  const direct =
    device?.sale_start_date ||
    device?.saleStartDate ||
    device?.sale_date ||
    device?.saleDate ||
    device?.predicted_available_date ||
    device?.predictedAvailableDate ||
    null;
  if (normalizeDateOnlyString(direct)) return direct;

  const storeRows = [];
  if (Array.isArray(device?.store_prices))
    storeRows.push(...device.store_prices);
  if (Array.isArray(device?.storePrices)) storeRows.push(...device.storePrices);
  for (const store of storeRows) {
    const storeDate =
      store?.sale_start_date ||
      store?.saleStartDate ||
      store?.sale_date ||
      store?.saleDate ||
      store?.available_from ||
      store?.availableFrom ||
      null;
    if (normalizeDateOnlyString(storeDate)) return storeDate;
  }

  for (const variant of Array.isArray(device?.variants)
    ? device.variants
    : []) {
    const variantDate =
      variant?.sale_start_date ||
      variant?.saleStartDate ||
      variant?.sale_date ||
      variant?.saleDate ||
      null;
    if (normalizeDateOnlyString(variantDate)) return variantDate;
  }

  return null;
};

const isUpcomingPhone = (device) => {
  if (isFutureDate(getSaleStartDate(device))) return true;
  return !hasStoreRows(device);
};

const uniquePhones = (devices = []) => {
  const seen = new Set();
  return (Array.isArray(devices) ? devices : [])
    .filter((device) => getPhoneName(device))
    .filter((device) => {
      const key = getPhoneKey(device);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const takePhones = (items = [], limit = 5) => items.slice(0, limit);

const sortLatestPhones = (devices = []) =>
  uniquePhones(devices)
    .map((phone) => ({ phone, date: getLaunchDate(phone) }))
    .sort((a, b) => {
      if (a.date && b.date) return b.date - a.date;
      if (a.date) return -1;
      if (b.date) return 1;
      return getPhoneName(a.phone).localeCompare(getPhoneName(b.phone));
    })
    .map((item) => item.phone);

const normalizeServerHighlightRows = (body) => {
  const rows = Array.isArray(body?.highlights) ? body.highlights : [];
  return rows
    .map((row) => ({
      label: normalizeText(row?.label),
      phones: (Array.isArray(row?.phones) ? row.phones : [])
        .map((phone) => ({
          ...phone,
          id: phone?.product_id ?? phone?.id ?? null,
          product_id: phone?.product_id ?? phone?.id ?? null,
          name: phone?.name ?? phone?.model ?? "",
          model: phone?.model ?? phone?.name ?? "",
        }))
        .filter((phone) => getPhoneName(phone)),
    }))
    .filter((row) => row.label && row.phones.length > 0);
};

const rowByLabel = (rows, pattern) =>
  rows.find((row) => pattern.test(row.label)) || null;

const HIGHLIGHT_ROWS = {
  upcoming: {
    title: "Upcoming Phones",
    subtitle: "What is launching soon",
    Icon: FaCalendarAlt,
    accentClass: "bg-blue-600",
    surfaceClass: "bg-blue-50/80 dark:bg-blue-500/10",
    iconClass:
      "bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
    textClass: "text-blue-700 dark:text-blue-300",
    viewAllPath: buildSmartphoneFilterPath("upcoming"),
  },
  trending: {
    title: "Trending Phones",
    subtitle: "Most explored right now",
    Icon: FaFireAlt,
    accentClass: "bg-emerald-500",
    surfaceClass: "bg-emerald-50/80 dark:bg-emerald-500/10",
    iconClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
    textClass: "text-emerald-700 dark:text-emerald-300",
    viewAllPath: buildSmartphoneFilterPath("trending"),
  },
  latest: {
    title: "Latest Phones",
    subtitle: "Recently launched models",
    Icon: FaStar,
    accentClass: "bg-amber-500",
    surfaceClass: "bg-amber-50/80 dark:bg-amber-500/10",
    iconClass:
      "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    textClass: "text-amber-700 dark:text-amber-300",
    viewAllPath: buildSmartphoneFilterPath("new"),
  },
  popular: {
    title: "Popular Picks",
    subtitle: "Useful ways to discover",
    Icon: FaMobileAlt,
    accentClass: "bg-violet-500",
    surfaceClass: "bg-violet-50/80 dark:bg-violet-500/10",
    iconClass:
      "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
    textClass: "text-violet-700 dark:text-violet-300",
    viewAllPath: "/smartphones",
  },
};

const POPULAR_PICKS = [
  {
    label: "Top Rated",
    copy: "Highly scored phones",
    Icon: FaTrophy,
    path: "/smartphones",
    iconClass:
      "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  },
  {
    label: "Best Value",
    copy: "Strong features for less",
    Icon: FaTag,
    path: buildSmartphoneFeaturePath("high-ram"),
    iconClass:
      "bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
  },
  {
    label: "Best Camera",
    copy: "Camera-focused models",
    Icon: FaCamera,
    path: buildSmartphoneFeaturePath("high-camera"),
    iconClass:
      "bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
  },
  {
    label: "Best Battery",
    copy: "Long-lasting performance",
    Icon: FaBatteryFull,
    path: buildSmartphoneFeaturePath("long-battery"),
    iconClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  {
    label: "Best for Gaming",
    copy: "Performance for gamers",
    Icon: FaGamepad,
    path: buildSmartphoneFeaturePath("gaming"),
    iconClass:
      "bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
  },
];

const resolveImageValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.url ||
      value.src ||
      value.path ||
      value.image_url ||
      value.imageUrl ||
      ""
    );
  }
  return "";
};

const getPhoneImageSafe = (phone) => {
  const variantImages = (Array.isArray(phone?.variants) ? phone.variants : [])
    .flatMap((variant) => [
      ...(Array.isArray(variant?.images) ? variant.images : []),
      variant?.image,
      variant?.image_url,
      variant?.imageUrl,
    ])
    .filter(Boolean);

  const candidates = [
    ...(Array.isArray(phone?.images) ? phone.images : []),
    ...(Array.isArray(phone?.image_urls) ? phone.image_urls : []),
    ...(Array.isArray(phone?.imageUrls) ? phone.imageUrls : []),
    ...variantImages,
    phone?.image,
    phone?.image_url,
    phone?.imageUrl,
    phone?.product_image,
    phone?.productImage,
    phone?.thumbnail,
    phone?.brand_logo_url,
    phone?.brand_logo,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeAssetUrl(resolveImageValue(candidate));
    if (resolved) return resolved;
  }
  return "";
};

const PhoneImage = ({ phone, className = "", imageClassName = "" }) => {
  const image = getPhoneImageSafe(phone);
  const name = getPhoneName(phone);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden bg-slate-50 dark:bg-slate-800/80 ${className}`}
    >
      {image && !imageFailed ? (
        <img
          src={image}
          alt={name || "Smartphone"}
          loading="lazy"
          onError={() => setImageFailed(true)}
          className={`h-full w-full object-contain p-2 ${imageClassName}`}
        />
      ) : (
        <FaMobileAlt
          className="text-xl text-slate-300 dark:text-slate-600"
          aria-hidden="true"
        />
      )}
    </span>
  );
};

const ViewAllLink = ({ to, className = "" }) => (
  <Link
    to={to}
    className={`inline-flex min-h-9 shrink-0 items-center gap-1 whitespace-nowrap text-xs font-extrabold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 ${className}`}
  >
    View all
  </Link>
);

const CategoryCell = ({ meta }) => {
  const Icon = meta.Icon;

  return (
    <div className="relative flex min-w-[190px] items-center gap-3 py-2">
      <span
        className={`absolute inset-y-0 left-0 w-1 rounded-full ${meta.accentClass}`}
        aria-hidden="true"
      />
      <span
        className={`grid h-11 w-1 shrink-0 place-items-center rounded-xl`}
      ></span>
      <span className="min-w-0">
        <strong className={`block text-sm font-black ${meta.textClass}`}>
          {meta.title}
        </strong>
        <span className="mt-0.5 block text-[10px] font-medium leading-4 text-slate-500 dark:text-slate-400">
          {meta.subtitle}
        </span>
      </span>
    </div>
  );
};

const ArtPhoneTile = ({ phone, mode = "latest", featured = false }) => {
  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className={`group relative flex min-w-0 items-center overflow-hidden   transition-all duration-200  dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-blue-500/30 ${
        featured ? "gap-4 p-3" : "gap-2.5 p-2.5"
      }`}
    >
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-slate-800 dark:via-slate-900 dark:to-blue-950/50 ${
          featured ? "h-24 w-20" : "h-16 w-14"
        }`}
      >
        <span
          className={`absolute -right-3 -top-3 rounded-full bg-blue-400/20 blur-xl ${
            featured ? "h-14 w-14" : "h-10 w-10"
          }`}
        />
        <span
          className={`absolute -bottom-4 -left-3 rounded-full bg-violet-400/15 blur-xl ${
            featured ? "h-16 w-16" : "h-10 w-10"
          }`}
        />
        <PhoneImage
          phone={phone}
          className="relative h-full w-full bg-transparent"
          imageClassName={featured ? "p-1" : "p-0.5"}
        />
      </div>

      <span className="min-w-0 flex-1">
        <strong
          className={`block truncate text-slate-950 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300 ${
            featured ? "text-sm font-black" : "text-xs font-extrabold"
          }`}
          title={name}
        >
          {name}
        </strong>

        <span
          className={`mt-1 flex items-center gap-1 truncate font-bold ${
            featured ? "text-[10px]" : "text-[9px]"
          } ${
            mode === "trending"
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {mode === "trending" ? (
            <>
              <FaArrowRight className="-rotate-45 text-[8px]" />
              Trending now
            </>
          ) : launchDate ? (
            formatMonthYear(launchDate)
          ) : (
            "Recently added"
          )}
        </span>
      </span>
    </Link>
  );
};

const UpcomingArt = ({ phone }) => {
  if (!phone) return null;

  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getSaleStartDate(phone) || getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className="group relative flex min-w-0 items-center gap-4 overflow-hidden bg-white  dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-900/70 dark:to-violet-500/10"
    >
      <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/80 dark:bg-slate-900/70">
        <span className="absolute h-24 w-24 rounded-full bg-blue-300/20 blur-2xl" />
        <span className="absolute -bottom-5 -right-5 h-20 w-20 bg-violet-300/20 blur-xl" />
        <PhoneImage
          phone={phone}
          className="relative h-24 w-24"
          imageClassName="p-2"
        />
      </div>

      <span className="min-w-0 flex-1">
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-400/15 dark:text-blue-300">
          Next launch
        </span>
        <strong className="mt-2 block truncate text-base font-black tracking-tight text-slate-950 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {name}
        </strong>
        <span className="mt-1 block truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          Expected launch: {formatMonthYear(launchDate)}
        </span>
      </span>
    </Link>
  );
};

const MobileTextPhoneTile = ({ phone, mode = "latest" }) => {
  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className="group flex min-w-[190px] flex-1 items-center gap-3 px-2.5 py-2.5"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <FaMobileAlt className="text-xs" />
      </span>
      <span className="min-w-0 flex-1">
        <strong
          className="block truncate text-xs font-extrabold text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300"
          title={name}
        >
          {name}
        </strong>
        <span
          className={`mt-0.5 flex items-center gap-1 truncate text-[9px] font-bold ${
            mode === "trending"
              ? "text-emerald-600 dark:text-emerald-300"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {mode === "trending" ? (
            <>
              <FaArrowRight className="-rotate-45 text-[7px]" />
              Trending now
            </>
          ) : launchDate ? (
            formatMonthYear(launchDate)
          ) : (
            "Recently added"
          )}
        </span>
      </span>
      <FaChevronRight className="shrink-0 text-[8px] text-slate-300 group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-blue-300" />
    </Link>
  );
};

const MobileUpcomingText = ({ phone }) => {
  if (!phone) return null;

  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getSaleStartDate(phone) || getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className="group flex min-w-0 items-center gap-3 px-2.5 py-2.5"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
        <FaRocket className="text-sm" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="inline-flex text-[8px] font-black uppercase tracking-[0.12em] text-blue-600 dark:text-blue-300">
          Next launch
        </span>
        <strong className="mt-0.5 block truncate text-sm font-black tracking-tight text-slate-950 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {name}
        </strong>
        <span className="mt-0.5 block truncate text-[9px] font-semibold text-slate-500 dark:text-slate-400">
          Expected launch: {formatMonthYear(launchDate)}
        </span>
      </span>
      <FaChevronRight className="shrink-0 text-[8px] text-slate-300 group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-blue-300" />
    </Link>
  );
};

const PopularArtTile = ({ item }) => {
  const Icon = item.Icon;

  return (
    <Link
      to={item.path}
      className="group flex min-w-0 items-center gap-2.5 rounded-xl  bg-slate-50/70 p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-700/60 dark:bg-slate-800/50 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10"
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.iconClass}`}
      >
        <Icon className="text-xs" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[12px] font-black text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {item.label}
        </strong>
        <span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {item.copy}
        </span>
      </span>
    </Link>
  );
};

const DesktopHighlightTableRow = ({ meta, children, viewAllPath }) => (
  <tr className="group border-t border-slate-200/80 align-middle transition-colors hover:bg-slate-50/50 dark:border-slate-700/60 dark:hover:bg-white/[0.02]">
    <td className="w-[220px] px-4 py-3 align-middle">
      <CategoryCell meta={meta} />
    </td>
    <td className="min-w-0 px-4 py-3">
      <div className="min-w-0">{children}</div>
    </td>
    <td className="w-[92px] px-4 py-3 text-right">
      <ViewAllLink to={viewAllPath} className="justify-end" />
    </td>
  </tr>
);

const MobileTableRow = ({ meta, children, viewAllPath }) => (
  <article className="overflow-hidden rounded-2xl bg-transparent">
    <div className="flex items-center justify-between gap-3 px-3">
      <CategoryCell meta={meta} />
      <ViewAllLink to={viewAllPath} />
    </div>
    <div className="p-3">{children}</div>
  </article>
);

const MobilePhoneHighlights = ({
  devices = [],
  className = "",
  context = "default",
}) => {
  const [serverRows, setServerRows] = useState([]);
  const [catalogPhones, setCatalogPhones] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const [highlightsResult, catalogResult] = await Promise.allSettled([
          fetchPublicJson(SMARTPHONE_HIGHLIGHTS_ENDPOINT, {
            signal: controller.signal,
          }),
          fetchPublicJson(SMARTPHONE_CATALOG_ENDPOINT, {
            signal: controller.signal,
          }),
        ]);

        if (cancelled) return;

        if (highlightsResult.status === "fulfilled") {
          const normalized = normalizeServerHighlightRows(
            highlightsResult.value,
          );
          if (normalized.length > 0) setServerRows(normalized);
        }

        if (catalogResult.status === "fulfilled") {
          const catalogBody = catalogResult.value;
          const phones = Array.isArray(catalogBody)
            ? catalogBody
            : Array.isArray(catalogBody?.smartphones)
              ? catalogBody.smartphones
              : Array.isArray(catalogBody?.data)
                ? catalogBody.data
                : [];
          setCatalogPhones(phones);
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const fallbackRows = useMemo(() => {
    const phones = uniquePhones(devices);
    if (!phones.length) return [];

    return [
      {
        label: "Upcoming Phones",
        phones: takePhones(phones.filter(isUpcomingPhone)),
      },
      {
        label: "Trending Phones",
        phones: takePhones(phones),
      },
      {
        label: "Latest Phones",
        phones: takePhones(sortLatestPhones(phones)),
      },
    ].filter((row) => row.phones.length);
  }, [devices]);

  const deviceLookup = useMemo(() => {
    const lookup = new Map();
    uniquePhones([...devices, ...catalogPhones]).forEach((phone) => {
      const name = getPhoneName(phone).toLowerCase();
      if (name) lookup.set(`name:${name}`, phone);
      const id = phone?.product_id ?? phone?.productId ?? phone?.id ?? null;
      if (id != null && String(id).trim()) lookup.set(`id:${id}`, phone);
    });
    return lookup;
  }, [catalogPhones, devices]);

  const rows = useMemo(() => {
    const sourceRows = serverRows.length > 0 ? serverRows : fallbackRows;
    return sourceRows.map((row) => ({
      ...row,
      phones: row.phones.map((phone) => {
        const id = phone?.product_id ?? phone?.productId ?? phone?.id ?? null;
        const name = getPhoneName(phone).toLowerCase();
        const match =
          (id != null ? deviceLookup.get(`id:${id}`) : null) ||
          (name ? deviceLookup.get(`name:${name}`) : null);
        if (!match) return phone;
        return {
          ...match,
          ...phone,
          images:
            Array.isArray(phone?.images) && phone.images.length
              ? phone.images
              : match.images,
          image:
            phone?.image ||
            phone?.image_url ||
            phone?.imageUrl ||
            match?.image ||
            match?.image_url ||
            match?.imageUrl,
        };
      }),
    }));
  }, [deviceLookup, fallbackRows, serverRows]);

  const allPhones = useMemo(
    () => uniquePhones(rows.flatMap((row) => row.phones)),
    [rows],
  );

  const upcomingPhones = takePhones(
    rowByLabel(rows, /upcoming|expected|launch/i)?.phones ||
      allPhones.filter(isUpcomingPhone),
    3,
  );
  const trendingPhones = takePhones(
    rowByLabel(rows, /trending|hot/i)?.phones || allPhones,
    5,
  );
  const latestPhones = takePhones(
    rowByLabel(rows, /latest|new/i)?.phones || sortLatestPhones(allPhones),
    5,
  );

  const highlightTitle =
    context === "upcoming"
      ? "Upcoming Mobile Phones in India"
      : context === "latest"
        ? "Latest Mobile Phones in India"
        : "Mobile Phone Highlights in India";

  const highlightCopy =
    context === "upcoming"
      ? "Track expected launches and phones gaining attention before release."
      : context === "latest"
        ? "Quick snapshot across trending and latest phones."
        : "Explore notable phones across launch, popularity and catalogue signals.";

  if (!allPhones.length) return null;

  return (
    <div className={` mx-auto w-full max-w-7xl`}>
      <section className="overflow-hidden bg-transparent px-1 py-5 sm:px-6 sm:py-7">
        <header className="max-w-3xl">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-blue-600 sm:text-[11px]">
            Key highlights
          </p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950 sm:text-2xl dark:text-slate-100">
            {highlightTitle}
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 dark:text-slate-400">
            {highlightCopy}
          </p>
        </header>

        <div className="mt-6 hidden overflow-hidden rounded-2xl lg:block dark:border-slate-700/60 dark:bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] table-fixed border-collapse">
              <tbody>
                {upcomingPhones[0] ? (
                  <DesktopHighlightTableRow
                    meta={HIGHLIGHT_ROWS.upcoming}
                    viewAllPath={HIGHLIGHT_ROWS.upcoming.viewAllPath}
                  >
                    <UpcomingArt phone={upcomingPhones[0]} />
                  </DesktopHighlightTableRow>
                ) : null}

                {trendingPhones.length ? (
                  <DesktopHighlightTableRow
                    meta={HIGHLIGHT_ROWS.trending}
                    viewAllPath={HIGHLIGHT_ROWS.trending.viewAllPath}
                  >
                    <div className="grid grid-flow-col auto-cols-fr gap-2">
                      {trendingPhones.map((phone) => (
                        <ArtPhoneTile
                          key={`trending-${getPhoneKey(phone)}`}
                          phone={phone}
                          mode="trending"
                        />
                      ))}
                    </div>
                  </DesktopHighlightTableRow>
                ) : null}

                {latestPhones.length ? (
                  <DesktopHighlightTableRow
                    meta={HIGHLIGHT_ROWS.latest}
                    viewAllPath={HIGHLIGHT_ROWS.latest.viewAllPath}
                  >
                    <div className="grid grid-flow-col auto-cols-fr gap-2">
                      {latestPhones.map((phone) => (
                        <ArtPhoneTile
                          key={`latest-${getPhoneKey(phone)}`}
                          phone={phone}
                          mode="latest"
                        />
                      ))}
                    </div>
                  </DesktopHighlightTableRow>
                ) : null}

                <DesktopHighlightTableRow
                  meta={HIGHLIGHT_ROWS.popular}
                  viewAllPath={HIGHLIGHT_ROWS.popular.viewAllPath}
                >
                  <div className="grid grid-flow-col auto-cols-fr gap-2">
                    {POPULAR_PICKS.map((item) => (
                      <PopularArtTile key={item.label} item={item} />
                    ))}
                  </div>
                </DesktopHighlightTableRow>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 space-y-3 lg:hidden">
          {upcomingPhones[0] ? (
            <MobileTableRow
              meta={HIGHLIGHT_ROWS.upcoming}
              viewAllPath={HIGHLIGHT_ROWS.upcoming.viewAllPath}
            >
              <MobileUpcomingText phone={upcomingPhones[0]} />
            </MobileTableRow>
          ) : null}

          {trendingPhones.length ? (
            <MobileTableRow
              meta={HIGHLIGHT_ROWS.trending}
              viewAllPath={HIGHLIGHT_ROWS.trending.viewAllPath}
            >
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {trendingPhones.map((phone) => (
                  <MobileTextPhoneTile
                    key={`mobile-trending-${getPhoneKey(phone)}`}
                    phone={phone}
                    mode="trending"
                  />
                ))}
              </div>
            </MobileTableRow>
          ) : null}

          {latestPhones.length ? (
            <MobileTableRow
              meta={HIGHLIGHT_ROWS.latest}
              viewAllPath={HIGHLIGHT_ROWS.latest.viewAllPath}
            >
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {latestPhones.map((phone) => (
                  <MobileTextPhoneTile
                    key={`mobile-latest-${getPhoneKey(phone)}`}
                    phone={phone}
                    mode="latest"
                  />
                ))}
              </div>
            </MobileTableRow>
          ) : null}

          <MobileTableRow
            meta={HIGHLIGHT_ROWS.popular}
            viewAllPath={HIGHLIGHT_ROWS.popular.viewAllPath}
          >
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {POPULAR_PICKS.map((item) => (
                <PopularArtTile key={item.label} item={item} />
              ))}
            </div>
          </MobileTableRow>
        </div>

        <Link
          to="/compare"
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/40 px-4 text-xs font-extrabold text-blue-600 transition-colors hover:bg-blue-50 sm:text-sm dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15"
        >
          <FaMobileAlt className="text-[11px]" />
          Compare phones side by side
          <FaArrowRight className="text-[9px]" />
        </Link>
      </section>
    </div>
  );
};

export default MobilePhoneHighlights;
