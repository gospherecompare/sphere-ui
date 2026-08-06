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
    if (Array.isArray(variant?.store_prices)) rows.push(...variant.store_prices);
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
  if (Array.isArray(device?.store_prices)) storeRows.push(...device.store_prices);
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
    iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
    textClass: "text-blue-700 dark:text-blue-300",
    viewAllPath: buildSmartphoneFilterPath("upcoming"),
  },
  trending: {
    title: "Trending Phones",
    subtitle: "Most explored right now",
    Icon: FaFireAlt,
    accentClass: "bg-emerald-500",
    surfaceClass: "bg-emerald-50/80 dark:bg-emerald-500/10",
    iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
    textClass: "text-emerald-700 dark:text-emerald-300",
    viewAllPath: buildSmartphoneFilterPath("trending"),
  },
  latest: {
    title: "Latest Phones",
    subtitle: "Recently launched models",
    Icon: FaStar,
    accentClass: "bg-amber-500",
    surfaceClass: "bg-amber-50/80 dark:bg-amber-500/10",
    iconClass: "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300",
    textClass: "text-amber-700 dark:text-amber-300",
    viewAllPath: buildSmartphoneFilterPath("new"),
  },
  popular: {
    title: "Popular Picks",
    subtitle: "Useful ways to discover",
    Icon: FaMobileAlt,
    accentClass: "bg-violet-500",
    surfaceClass: "bg-violet-50/80 dark:bg-violet-500/10",
    iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
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
    iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  },
  {
    label: "Best Value",
    copy: "Strong features for less",
    Icon: FaTag,
    path: buildSmartphoneFeaturePath("high-ram"),
    iconClass: "bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300",
  },
  {
    label: "Best Camera",
    copy: "Camera-focused models",
    Icon: FaCamera,
    path: buildSmartphoneFeaturePath("high-camera"),
    iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300",
  },
  {
    label: "Best Battery",
    copy: "Long-lasting performance",
    Icon: FaBatteryFull,
    path: buildSmartphoneFeaturePath("long-battery"),
    iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  {
    label: "Best for Gaming",
    copy: "Performance for gamers",
    Icon: FaGamepad,
    path: buildSmartphoneFeaturePath("gaming"),
    iconClass: "bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
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
        <FaMobileAlt className="text-xl text-slate-300 dark:text-slate-600" aria-hidden="true" />
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
    <FaChevronRight className="text-[9px]" />
  </Link>
);

const CategoryPanel = ({ meta, mobile = false }) => {
  const Icon = meta.Icon;
  return (
    <div
      className={`relative flex min-w-0 items-center gap-3 overflow-hidden ${meta.surfaceClass} ${
        mobile ? "px-4 py-3" : "h-full min-h-[132px] px-5 py-5"
      }`}
    >
      <span
        className={`absolute inset-y-0 left-0 w-1 ${meta.accentClass}`}
        aria-hidden="true"
      />
      <span
        className={`grid shrink-0 place-items-center rounded-full ${meta.iconClass} ${
          mobile ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <Icon className={mobile ? "text-sm" : "text-base"} />
      </span>
      <span className="min-w-0">
        <strong
          className={`block truncate whitespace-nowrap font-black ${meta.textClass} ${
            mobile ? "text-sm" : "text-base"
          }`}
        >
          {meta.title}
        </strong>
        <span
          className={`mt-0.5 block truncate whitespace-nowrap font-medium text-slate-600 opacity-80 dark:text-slate-300 ${
            mobile ? "text-[10px]" : "text-xs"
          }`}
        >
          {meta.subtitle}
        </span>
      </span>
    </div>
  );
};

const UpcomingDesktop = ({ phone }) => {
  if (!phone) return null;
  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getSaleStartDate(phone) || getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className="group grid min-h-[132px] min-w-0 grid-cols-[180px_minmax(0,1fr)_42px] items-center gap-5 px-5 py-4 transition-colors hover:bg-blue-50/40 dark:hover:bg-white/[0.035]"
    >
      <div className="relative grid h-28 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-800 dark:via-slate-800/80 dark:to-blue-950/50">
        <span className="absolute h-32 w-32 rounded-full bg-blue-100/70 blur-sm dark:bg-blue-500/10" />
        <PhoneImage
          phone={phone}
          className="relative h-28 w-36 bg-transparent"
          imageClassName="p-1"
        />
      </div>
      <span className="min-w-0">
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-blue-700 dark:bg-blue-400/15 dark:text-blue-300">
          Next launch
        </span>
        <strong className="mt-2 block truncate whitespace-nowrap text-lg font-black tracking-tight text-slate-950 transition-colors group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {name}
        </strong>
        <span className="mt-1 block truncate whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400">
          Expected launch: {formatMonthYear(launchDate)}
        </span>
      </span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-400/15 dark:text-blue-300 dark:group-hover:bg-blue-500">
        <FaChevronRight className="text-[10px]" />
      </span>
    </Link>
  );
};

const UpcomingMobile = ({ phone }) => {
  if (!phone) return null;
  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getSaleStartDate(phone) || getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className="group grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-blue-50 dark:bg-slate-800/70 dark:hover:bg-slate-800"
    >
      <div className="relative grid h-28 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-800 dark:via-slate-800/80 dark:to-blue-950/50">
        <PhoneImage
          phone={phone}
          className="h-28 w-24 bg-transparent"
          imageClassName="p-1"
        />
      </div>
      <span className="min-w-0">
        <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.1em] text-blue-700 dark:bg-blue-400/15 dark:text-blue-300">
          Next launch
        </span>
        <strong
          className="mt-2 block truncate whitespace-nowrap text-base font-black text-slate-950 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300"
          title={name}
        >
          {name}
        </strong>
        <span className="mt-1 block truncate whitespace-nowrap text-[10px] font-medium text-slate-500 dark:text-slate-400">
          Expected launch: {formatMonthYear(launchDate)}
        </span>
        <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-300">
          View phone <FaChevronRight className="text-[8px]" />
        </span>
      </span>
    </Link>
  );
};

const DesktopPhoneItem = ({ phone, mode }) => {
  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className="group flex min-w-[172px] flex-1 items-center gap-3 border-r border-slate-200/70 px-4 py-4 last:border-r-0 hover:bg-blue-50/40 dark:border-slate-700/60 dark:hover:bg-white/[0.035]"
    >
      <PhoneImage phone={phone} className="h-20 w-14 rounded-xl" />
      <span className="min-w-0 flex-1">
        <strong
          className="block max-w-full truncate whitespace-nowrap text-sm font-extrabold text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300"
          title={name}
        >
          {name}
        </strong>
        <span
          className={`mt-1 inline-flex max-w-full items-center gap-1 truncate whitespace-nowrap text-[10px] font-bold ${
            mode === "trending" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-400 dark:text-slate-500"
          }`}
        >
          {mode === "trending" ? (
            <>
              <FaArrowRight className="-rotate-45 text-[8px]" /> Trending now
            </>
          ) : launchDate ? (
            formatMonthYear(launchDate)
          ) : (
            "View details"
          )}
        </span>
      </span>
      <FaChevronRight className="shrink-0 text-[9px] text-slate-300 group-hover:text-blue-600 dark:text-slate-600 dark:group-hover:text-blue-300" />
    </Link>
  );
};

const MobilePhoneCard = ({ phone, mode }) => {
  const name = getPhoneName(phone);
  const path = createProductPath("smartphones", name);
  const launchDate = getLaunchDateValue(phone);

  return (
    <Link
      to={path}
      className="group grid min-w-[82%] snap-start grid-cols-[82px_minmax(0,1fr)] items-center gap-3 rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-blue-50 sm:min-w-[48%] dark:bg-slate-800/70 dark:hover:bg-slate-800"
    >
      <PhoneImage phone={phone} className="h-24 w-[82px] rounded-xl bg-white dark:bg-slate-900" />
      <span className="min-w-0">
        <strong
          className="block truncate whitespace-nowrap text-sm font-black text-slate-950 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300"
          title={name}
        >
          {name}
        </strong>
        <span
          className={`mt-1 inline-flex max-w-full items-center gap-1 truncate whitespace-nowrap text-[10px] font-bold ${
            mode === "trending" ? "text-emerald-600 dark:text-emerald-300" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {mode === "trending" ? (
            <>
              <FaArrowRight className="-rotate-45 text-[8px]" /> Trending now
            </>
          ) : launchDate ? (
            formatMonthYear(launchDate)
          ) : (
            "Recently added"
          )}
        </span>
        <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-300">
          View details <FaChevronRight className="text-[8px]" />
        </span>
      </span>
    </Link>
  );
};

const PopularPickDesktop = ({ item }) => {
  const Icon = item.Icon;
  return (
    <Link
      to={item.path}
      className="group flex min-w-[170px] flex-1 items-center gap-3 border-r border-slate-200/70 px-4 py-4 last:border-r-0 hover:bg-blue-50/40 dark:border-slate-700/60 dark:hover:bg-white/[0.035]"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${item.iconClass}`}>
        <Icon className="text-sm" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate whitespace-nowrap text-sm font-extrabold text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {item.label}
        </strong>
        <span className="mt-0.5 block truncate whitespace-nowrap text-[10px] font-medium text-slate-500 dark:text-slate-400">
          {item.copy}
        </span>
      </span>
      <FaChevronRight className="text-[9px] text-blue-500" />
    </Link>
  );
};

const PopularPickMobile = ({ item }) => {
  const Icon = item.Icon;
  return (
    <Link
      to={item.path}
      className="group flex min-w-0 items-center gap-2.5 rounded-xl bg-slate-50 p-3 hover:bg-blue-50 dark:bg-slate-800/70 dark:hover:bg-slate-800"
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${item.iconClass}`}>
        <Icon className="text-xs" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate whitespace-nowrap text-[11px] font-extrabold text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          {item.label}
        </strong>
        <span className="mt-0.5 block truncate whitespace-nowrap text-[9px] font-medium text-slate-500 dark:text-slate-400">
          {item.copy}
        </span>
      </span>
    </Link>
  );
};

const DesktopHighlightRow = ({ meta, children, viewAllPath }) => (
  <article className="grid min-h-[132px] grid-cols-[230px_minmax(0,1fr)_90px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-900/45">
    <CategoryPanel meta={meta} />
    <div className="min-w-0 overflow-hidden">{children}</div>
    <div className="flex items-center justify-center">
      <ViewAllLink to={viewAllPath} />
    </div>
  </article>
);

const MobileHighlightSection = ({ meta, children, viewAllPath }) => (
  <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/60 dark:bg-slate-900/45">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <CategoryPanel meta={meta} mobile />
      </div>
      <ViewAllLink to={viewAllPath} className="pr-3" />
    </div>
    <div className="p-3 pt-0">{children}</div>
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
    <div className={`smartphones-highlights-section mx-auto w-full max-w-7xl ${className}`}>
      <section className="overflow-hidden rounded-2xl bg-white px-3 py-5 sm:px-6 sm:py-7 dark:bg-[#0b1727]">
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

        <div className="mt-5 hidden space-y-3 lg:block">
          {upcomingPhones[0] ? (
            <DesktopHighlightRow
              meta={HIGHLIGHT_ROWS.upcoming}
              viewAllPath={HIGHLIGHT_ROWS.upcoming.viewAllPath}
            >
              <UpcomingDesktop phone={upcomingPhones[0]} />
            </DesktopHighlightRow>
          ) : null}

          {trendingPhones.length ? (
            <DesktopHighlightRow
              meta={HIGHLIGHT_ROWS.trending}
              viewAllPath={HIGHLIGHT_ROWS.trending.viewAllPath}
            >
              <div className="flex h-full min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {trendingPhones.map((phone) => (
                  <DesktopPhoneItem
                    key={`trending-${getPhoneKey(phone)}`}
                    phone={phone}
                    mode="trending"
                  />
                ))}
              </div>
            </DesktopHighlightRow>
          ) : null}

          {latestPhones.length ? (
            <DesktopHighlightRow
              meta={HIGHLIGHT_ROWS.latest}
              viewAllPath={HIGHLIGHT_ROWS.latest.viewAllPath}
            >
              <div className="flex h-full min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {latestPhones.map((phone) => (
                  <DesktopPhoneItem
                    key={`latest-${getPhoneKey(phone)}`}
                    phone={phone}
                    mode="latest"
                  />
                ))}
              </div>
            </DesktopHighlightRow>
          ) : null}

          <DesktopHighlightRow
            meta={HIGHLIGHT_ROWS.popular}
            viewAllPath={HIGHLIGHT_ROWS.popular.viewAllPath}
          >
            <div className="flex h-full min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {POPULAR_PICKS.map((item) => (
                <PopularPickDesktop key={item.label} item={item} />
              ))}
            </div>
          </DesktopHighlightRow>
        </div>

        <div className="mt-4 space-y-3 lg:hidden">
          {upcomingPhones[0] ? (
            <MobileHighlightSection
              meta={HIGHLIGHT_ROWS.upcoming}
              viewAllPath={HIGHLIGHT_ROWS.upcoming.viewAllPath}
            >
              <UpcomingMobile phone={upcomingPhones[0]} />
            </MobileHighlightSection>
          ) : null}

          {trendingPhones.length ? (
            <MobileHighlightSection
              meta={HIGHLIGHT_ROWS.trending}
              viewAllPath={HIGHLIGHT_ROWS.trending.viewAllPath}
            >
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {trendingPhones.map((phone) => (
                  <MobilePhoneCard
                    key={`mobile-trending-${getPhoneKey(phone)}`}
                    phone={phone}
                    mode="trending"
                  />
                ))}
              </div>
            </MobileHighlightSection>
          ) : null}

          {latestPhones.length ? (
            <MobileHighlightSection
              meta={HIGHLIGHT_ROWS.latest}
              viewAllPath={HIGHLIGHT_ROWS.latest.viewAllPath}
            >
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {latestPhones.map((phone) => (
                  <MobilePhoneCard
                    key={`mobile-latest-${getPhoneKey(phone)}`}
                    phone={phone}
                    mode="latest"
                  />
                ))}
              </div>
            </MobileHighlightSection>
          ) : null}

          <MobileHighlightSection
            meta={HIGHLIGHT_ROWS.popular}
            viewAllPath={HIGHLIGHT_ROWS.popular.viewAllPath}
          >
            <div className="grid grid-cols-2 gap-2">
              {POPULAR_PICKS.map((item) => (
                <PopularPickMobile key={item.label} item={item} />
              ))}
            </div>
          </MobileHighlightSection>
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
