import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowRight, LuShieldCheck, LuSparkles } from "react-icons/lu";
import { useDevice } from "../../hooks/useDevice";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import { buildPublicSmartphoneBrandPath as buildSmartphoneBrandPath } from "../../utils/smartphoneListingRoutes";

const BRAND_PRIORITY = [
  "apple",
  "samsung",
  "oneplus",
  "xiaomi",
  "nothing",
  "realme",
  "asus",
  "google",
  "poco",
  "vivo",
  "oppo",
  "iqoo",
  "motorola",
  "honor",
  "huawei",
  "infinix",
  "tecno",
  "nokia",
  "sony",
  "lava",
];

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = normalizeText(item);
      if (text) return text;
    }
    return "";
  }
  if (typeof value === "object") {
    return (
      normalizeText(value?.name) ||
      normalizeText(value?.brand_name) ||
      normalizeText(value?.title) ||
      normalizeText(value?.value) ||
      ""
    );
  }
  const text = String(value).trim();
  return /^(null|undefined|n\/a|na)$/i.test(text) ? "" : text;
};

const normalizeBrandKey = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const slugify = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pickImage = (...values) => {
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = pickImage(...value);
      if (nested) return nested;
      continue;
    }
    if (typeof value === "object") {
      const nested = pickImage(
        value.url,
        value.src,
        value.image,
        value.image_url,
        value.thumbnail,
        value.logo,
      );
      if (nested) return nested;
      continue;
    }
    const text = String(value).trim();
    if (text && !/^(null|undefined|n\/a|na)$/i.test(text)) return text;
  }
  return "";
};

const getDeviceBrand = (device) =>
  normalizeText(
    device?.brand_name ||
      device?.brand ||
      device?.basic_info?.brand_name ||
      device?.basic_info?.brand ||
      device?.basic_info_json?.brand_name ||
      device?.basic_info_json?.brand ||
      device?.specifications?.brand,
  );

const getDeviceCategory = (device) =>
  normalizeText(
    device?.deviceType ||
      device?.category ||
      device?.product_type ||
      device?.type ||
      device?.basic_info?.category,
  );

const flattenBrands = (brands = []) => {
  const rows = [];

  brands.forEach((brand) => {
    if (Array.isArray(brand?.brands)) {
      brand.brands.forEach((nested) => {
        rows.push({
          ...nested,
          category:
            nested?.category ||
            nested?.product_type ||
            brand?.category ||
            brand?.product_type ||
            brand?.name ||
            "",
          originalBrand: nested,
        });
      });
      return;
    }

    rows.push({
      ...brand,
      originalBrand: brand?.originalBrand || brand,
    });
  });

  return rows;
};

const getBrandCount = (brand, group) => {
  const rawCount =
    brand?.published_products ??
    brand?.published_products_count ??
    brand?.products_count ??
    brand?.device_count ??
    brand?.devices_count ??
    brand?.products;
  const numeric = Number(rawCount);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return group?.count || 0;
};

const getBrandPath = (brand) => {
  const category = normalizeText(brand?.category).toLowerCase();
  const slug = brand?.slug || slugify(brand?.name);

  if (category.includes("lap") || category.includes("computer")) {
    return `/laptops?brand=${encodeURIComponent(slug)}`;
  }
  if (category.includes("tv") || category.includes("television")) {
    return `/tvs?brand=${encodeURIComponent(slug)}`;
  }
  if (
    category.includes("network") ||
    category.includes("router") ||
    category.includes("wifi")
  ) {
    return `/networking?brand=${encodeURIComponent(slug)}`;
  }

  return buildSmartphoneBrandPath(slug);
};

const PHONE_THEMES = {
  apple: {
    bodies: ["#2B2B2F", "#E8D9C5", "#0F1117"],
    accent: "#F97316",
    camera: "triple",
  },
  samsung: {
    bodies: ["#D7DEEA", "#AEB9CF", "#111827"],
    accent: "#60A5FA",
    camera: "stack",
  },
  oneplus: {
    bodies: ["#7AAE98", "#0F302B", "#101418"],
    accent: "#22C55E",
    camera: "circle",
  },
  xiaomi: {
    bodies: ["#E9EEF5", "#B8D8C3", "#A7D8FF"],
    accent: "#F97316",
    camera: "dual",
  },
  nothing: {
    bodies: ["#F8FAFC", "#E7E5E4", "#1F2937"],
    accent: "#94A3B8",
    camera: "glyph",
  },
  realme: {
    bodies: ["#C8E8F7", "#F2E7CB", "#111827"],
    accent: "#FACC15",
    camera: "circle",
  },
  asus: {
    bodies: ["#0F172A", "#111827", "#1F2937"],
    accent: "#22D3EE",
    camera: "gaming",
  },
  google: {
    bodies: ["#5B606B", "#C4B69A", "#F5F5EF"],
    accent: "#60A5FA",
    camera: "bar",
  },
  poco: {
    bodies: ["#111827", "#FACC15", "#374151"],
    accent: "#FACC15",
    camera: "block",
  },
  vivo: {
    bodies: ["#EAF2FF", "#F8FAFC", "#8DBBFF"],
    accent: "#2563EB",
    camera: "circle",
  },
  oppo: {
    bodies: ["#E9F7EF", "#D6F2E2", "#1F2937"],
    accent: "#16A34A",
    camera: "circle",
  },
  iqoo: {
    bodies: ["#F9FAFB", "#FACC15", "#111827"],
    accent: "#F97316",
    camera: "block",
  },
  motorola: {
    bodies: ["#E0F2FE", "#F8FAFC", "#334155"],
    accent: "#2563EB",
    camera: "circle",
  },
  moto: {
    bodies: ["#E0F2FE", "#F8FAFC", "#334155"],
    accent: "#2563EB",
    camera: "circle",
  },
  honor: {
    bodies: ["#EEF2FF", "#DBEAFE", "#111827"],
    accent: "#7C3AED",
    camera: "circle",
  },
  huawei: {
    bodies: ["#FEE2E2", "#F8FAFC", "#334155"],
    accent: "#DC2626",
    camera: "circle",
  },
  infinix: {
    bodies: ["#ECFCCB", "#F8FAFC", "#1F2937"],
    accent: "#84CC16",
    camera: "block",
  },
  tecno: {
    bodies: ["#E0F7FA", "#E0E7FF", "#0F172A"],
    accent: "#06B6D4",
    camera: "dual",
  },
  nokia: {
    bodies: ["#E2E8F0", "#CBD5E1", "#1E3A8A"],
    accent: "#2563EB",
    camera: "bar",
  },
  sony: {
    bodies: ["#111827", "#374151", "#F8FAFC"],
    accent: "#60A5FA",
    camera: "stack",
  },
  lava: {
    bodies: ["#1F2937", "#F97316", "#F8FAFC"],
    accent: "#EA580C",
    camera: "dual",
  },
  lenovo: {
    bodies: ["#F3F4F6", "#DC2626", "#111827"],
    accent: "#DC2626",
    camera: "dual",
  },
  redmi: {
    bodies: ["#E9EEF5", "#B8D8C3", "#A7D8FF"],
    accent: "#F97316",
    camera: "dual",
  },
  default: {
    bodies: ["#E2E8F0", "#CBD5E1", "#111827"],
    accent: "#7C3AED",
    camera: "dual",
  },
};

const getPhoneTheme = (name) => PHONE_THEMES[normalizeBrandKey(name)] || PHONE_THEMES.default;

const lens = (x, y, r = 8) => `
  <circle cx="${x}" cy="${y}" r="${r + 2}" fill="rgba(255,255,255,0.42)"/>
  <circle cx="${x}" cy="${y}" r="${r}" fill="#10141b"/>
  <circle cx="${x - 2}" cy="${y - 2}" r="${Math.max(2, r / 3)}" fill="#e5edf7" opacity="0.65"/>
`;

const cameraSvg = (type, accent) => {
  if (type === "bar") {
    return `
      <rect x="27" y="24" width="66" height="23" rx="11.5" fill="#1f2937" opacity="0.9"/>
      ${lens(42, 35, 6)}
      ${lens(78, 35, 6)}
      <circle cx="60" cy="35" r="3.2" fill="${accent}" opacity="0.8"/>
    `;
  }

  if (type === "glyph") {
    return `
      <circle cx="42" cy="36" r="13" fill="none" stroke="#cbd5e1" stroke-width="2"/>
      <circle cx="65" cy="62" r="17" fill="none" stroke="#dbe3ea" stroke-width="2"/>
      ${lens(78, 35, 6)}
      <path d="M39 78 C51 69 62 70 74 80" fill="none" stroke="#e2e8f0" stroke-width="2"/>
    `;
  }

  if (type === "gaming") {
    return `
      <rect x="33" y="24" width="24" height="24" rx="7" fill="#121826"/>
      ${lens(45, 36, 7)}
      <path d="M58 102 L78 82 L98 102 L78 122 Z" fill="${accent}" opacity="0.72"/>
      <path d="M61 102 L78 88 L95 102 L78 116 Z" fill="#0f172a" opacity="0.32"/>
    `;
  }

  if (type === "block") {
    return `
      <rect x="29" y="24" width="48" height="48" rx="15" fill="#111827" opacity="0.95"/>
      ${lens(53, 48, 9)}
      <circle cx="68" cy="34" r="4" fill="${accent}" opacity="0.9"/>
    `;
  }

  if (type === "stack") {
    return `
      ${lens(41, 33, 8)}
      ${lens(41, 58, 8)}
      ${lens(41, 83, 8)}
      <circle cx="60" cy="44" r="4" fill="${accent}" opacity="0.85"/>
    `;
  }

  if (type === "triple") {
    return `
      <rect x="26" y="21" width="48" height="52" rx="15" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.42)"/>
      ${lens(42, 38, 8)}
      ${lens(60, 38, 8)}
      ${lens(42, 58, 8)}
      <circle cx="60" cy="58" r="4" fill="${accent}" opacity="0.9"/>
    `;
  }

  if (type === "circle") {
    return `
      <circle cx="55" cy="46" r="25" fill="rgba(12,18,28,0.82)"/>
      ${lens(46, 40, 7)}
      ${lens(64, 40, 7)}
      ${lens(55, 59, 7)}
      <circle cx="55" cy="46" r="28" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
    `;
  }

  return `
    ${lens(43, 36, 8)}
    ${lens(66, 36, 8)}
    <circle cx="55" cy="56" r="4" fill="${accent}" opacity="0.85"/>
  `;
};

const buildPhoneImage = ({ color, accent, camera }) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="174" viewBox="0 0 120 174">
      <defs>
        <linearGradient id="body" x1="14" y1="8" x2="110" y2="166" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.72"/>
          <stop offset="0.24" stop-color="${color}"/>
          <stop offset="0.74" stop-color="${color}"/>
          <stop offset="1" stop-color="#0f172a" stop-opacity="0.22"/>
        </linearGradient>
        <linearGradient id="shine" x1="22" y1="10" x2="94" y2="166" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.58"/>
          <stop offset="0.38" stop-color="#ffffff" stop-opacity="0.05"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0.22"/>
        </linearGradient>
        <filter id="shadow" x="-25%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="15" stdDeviation="9" flood-color="#0f172a" flood-opacity="0.24"/>
        </filter>
      </defs>
      <rect x="20" y="8" width="80" height="156" rx="22" fill="#d9e1eb" filter="url(#shadow)"/>
      <rect x="23" y="10" width="74" height="152" rx="20" fill="url(#body)" stroke="rgba(255,255,255,0.72)" stroke-width="1.5"/>
      <rect x="25" y="12" width="70" height="148" rx="18" fill="url(#shine)" opacity="0.54"/>
      <path d="M30 101 C45 96 70 96 92 86 L92 156 L30 156 Z" fill="#101827" opacity="0.16"/>
      <path d="M78 130 L98 110" stroke="${accent}" stroke-width="1.8" stroke-linecap="round" opacity="0.82"/>
      ${cameraSvg(camera, accent)}
      <rect x="96" y="54" width="2" height="28" rx="1" fill="#b8c2cf" opacity="0.8"/>
      <rect x="22" y="48" width="2" height="18" rx="1" fill="#eef2f7" opacity="0.82"/>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const PhoneMockup = ({ color, accent, camera, index }) => {
  const offset = (index - 1) * 20;
  const rotate = [-2, 1, 3][index] || 0;
  const image = buildPhoneImage({ color, accent, camera });

  return (
    <img
      src={image}
      alt=""
      aria-hidden="true"
      className="absolute bottom-0 left-1/2 h-[76px] w-[54px] object-contain drop-shadow-[0_10px_12px_rgba(15,23,42,0.12)] transition-transform duration-300 group-hover:-translate-y-0.5"
      style={{
        transform: `translateX(calc(-50% + ${offset}px)) rotate(${rotate}deg)`,
        zIndex: 10 + index,
      }}
    />
  );
};

const BrandLogo = ({ brand }) => {
  const [failed, setFailed] = useState(false);

  if (brand.logo && !failed) {
    return (
      <img
        src={brand.logo}
        alt={`${brand.name} logo`}
        loading="lazy"
        decoding="async"
        className="h-6 w-[74px] object-contain"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="flex h-6 max-w-[104px] items-center justify-center text-center text-[15px] font-extrabold leading-none tracking-[-0.02em] text-slate-900">
      {brand.name}
    </span>
  );
};

const DeviceStack = ({ brand }) => {
  const theme = getPhoneTheme(brand.name);
  return (
    <div className="relative mx-auto h-full w-full max-w-[170px]">
      {theme.bodies.slice(0, 3).map((color, index) => (
        <PhoneMockup
          key={`${brand.name}-${color}-${index}`}
          color={color}
          accent={theme.accent}
          camera={theme.camera}
          index={index}
        />
      ))}
    </div>
  );
};

const BrandCard = ({ brand, index, isActive, onOpen }) => (
  <article
    className={`group flex w-[176px] shrink-0 flex-col rounded-[10px] border bg-white px-3 pb-3 pt-3 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all duration-300 md:w-[176px] ${
      isActive
        ? "border-[rgba(124,58,237,0.34)] shadow-[0_14px_34px_rgba(124,58,237,0.13)]"
        : "border-slate-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_12px_28px_rgba(124,58,237,0.10)]"
    }`}
    style={{ transitionDelay: `${index * 45}ms` }}
  >
    <div className="flex h-6 items-center justify-center">
      <BrandLogo brand={brand} />
    </div>

    <div className="mt-2 text-center">
      <h3 className="line-clamp-1 text-[14px] font-bold leading-tight tracking-[-0.02em] text-slate-900">
        {brand.name}
      </h3>
      <p className="mt-0.5 text-[10px] font-medium text-slate-500">
        {brand.count || 0} devices
      </p>
    </div>

    <div className="mt-2 h-[78px] overflow-hidden rounded-[6px] bg-[#F8FAFC] px-2 pt-1">
      <DeviceStack brand={brand} />
    </div>

    <button
      type="button"
      onClick={onOpen}
      className="mt-2.5 inline-flex h-8 w-full items-center justify-between rounded-[8px] border border-slate-200 bg-white px-3 text-[11px] font-semibold text-violet-700 transition-all duration-300 hover:bg-violet-50 hover:shadow-[0_10px_22px_rgba(124,58,237,0.10)]"
    >
      <span className="truncate">Explore {brand.name}</span>
      <LuArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
    </button>
  </article>
);

const PopularBrands = () => {
  const navigate = useNavigate();
  const isLoaded = useRevealAnimation();
  const deviceCtx = useDevice();

  const deviceGroups = useMemo(() => {
    const groups = new Map();

    (deviceCtx?.devices || []).forEach((device) => {
      const brandName = getDeviceBrand(device);
      const key = normalizeBrandKey(brandName);
      if (!key) return;

      const existing =
        groups.get(key) || {
          name: brandName,
          count: 0,
          category: getDeviceCategory(device),
        };

      existing.count += 1;
      if (!existing.category) existing.category = getDeviceCategory(device);

      groups.set(key, existing);
    });

    return groups;
  }, [deviceCtx?.devices]);

  const brands = useMemo(() => {
    const rows = new Map();
    const flattened = flattenBrands(deviceCtx?.brands || []);

    flattened.forEach((brand) => {
      const name = normalizeText(brand?.name || brand?.brand_name || brand?.title);
      const key = normalizeBrandKey(name);
      if (!key || rows.has(key)) return;

      const group = deviceGroups.get(key);
      rows.set(key, {
        id: brand?.id || key,
        name,
        logo: pickImage(brand?.logo, brand?.image, brand?.logo_url),
        slug: brand?.slug || slugify(name),
        category: normalizeText(brand?.category || brand?.product_type || group?.category),
        count: getBrandCount(brand, group),
      });
    });

    deviceGroups.forEach((group, key) => {
      if (rows.has(key)) return;
      rows.set(key, {
        id: key,
        name: group.name,
        logo: "",
        slug: slugify(group.name),
        category: group.category,
        count: group.count,
      });
    });

    return Array.from(rows.values())
      .filter((brand) => brand.name)
      .sort((left, right) => {
        const leftRank = BRAND_PRIORITY.indexOf(normalizeBrandKey(left.name));
        const rightRank = BRAND_PRIORITY.indexOf(normalizeBrandKey(right.name));
        const normalizedLeftRank = leftRank === -1 ? 999 : leftRank;
        const normalizedRightRank = rightRank === -1 ? 999 : rightRank;

        if (normalizedLeftRank !== normalizedRightRank) {
          return normalizedLeftRank - normalizedRightRank;
        }

        const countDelta = (right.count || 0) - (left.count || 0);
        if (countDelta !== 0) return countDelta;
        return left.name.localeCompare(right.name);
      })
      .slice(0, 12);
  }, [deviceCtx?.brands, deviceGroups]);

  return (
    <section
      className={`relative overflow-hidden bg-[linear-gradient(180deg,#F8FAFC_0%,#F1F5F9_100%)] px-4 py-10 text-slate-900 transition-all duration-700 sm:px-6 lg:px-8 lg:py-12 ${
        isLoaded ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(circle_at_center,white,transparent_82%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(124,58,237,0.08),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(37,99,235,0.07),transparent_24%)]" />

      <div className="relative mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(124,58,237,0.14)] bg-[rgba(124,58,237,0.08)] text-violet-600">
              <LuShieldCheck className="h-[15px] w-[15px]" />
            </span>
            <div>
              <h2 className="text-[20px] font-extrabold uppercase leading-tight tracking-[-0.02em] text-slate-900 sm:text-[22px]">
                Popular Brands
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] font-medium leading-[1.5] text-slate-500 sm:text-[14px]">
                Explore top brands and discover their best devices
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/brands")}
            className="inline-flex items-center gap-2 self-start text-sm font-semibold text-violet-700 transition-all duration-300 hover:translate-x-1 hover:text-violet-800"
          >
            View all brands
            <LuArrowRight className="h-4 w-4" />
          </button>
        </div>

        {brands.length > 0 && (
          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 no-scrollbar md:grid md:grid-cols-[repeat(3,176px)] md:justify-between md:overflow-visible md:pb-0 lg:grid-cols-[repeat(4,176px)] xl:grid-cols-[repeat(6,176px)]">
            {brands.map((brand, index) => (
              <BrandCard
                key={brand.id || brand.name}
                brand={brand}
                index={index}
                isActive={index === 0}
                onOpen={() => navigate(getBrandPath(brand))}
              />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2.5 text-center text-[13px] font-medium text-slate-500 sm:text-[14px]">
          <LuSparkles className="h-3.5 w-3.5 text-purple-400" />
          <p>More brands. More choices. Better comparisons.</p>
          <LuSparkles className="h-3.5 w-3.5 text-purple-400" />
        </div>
      </div>
    </section>
  );
};

export default PopularBrands;
