import React from "react";
import {
  FaArrowRight,
  FaExternalLinkAlt,
  FaLink,
  FaStore,
} from "react-icons/fa";
import { buildAffiliateRedirectHref } from "../../hooks/useAffiliatePlacements";
import { API_ORIGIN_URL } from "../../utils/apiUrl";

const toAbsoluteAssetUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(raw)) return raw;
  if (/^(?:data:|blob:)/i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${API_ORIGIN_URL}${raw}`;
  return `${API_ORIGIN_URL}/${raw.replace(/^\/+/, "")}`;
};

const formatPrice = (value, currencyCode = "INR") => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode || "INR",
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `₹${Math.round(numeric).toLocaleString("en-IN")}`;
  }
};

const AffiliatePlacementCard = ({
  placement,
  pageType,
  productId = null,
  blogId = null,
  variant = "listing-card",
  className = "",
}) => {
  if (!placement) return null;

  const href = buildAffiliateRedirectHref({
    placementId: placement.id,
    pageType,
    slot: placement.slot || "",
    productId: productId || placement.matched_product_id || null,
    blogId: blogId || placement.matched_blog_id || null,
  });
  const imageUrl = toAbsoluteAssetUrl(placement.image_url);
  const priceLabel = formatPrice(placement.price, placement.currency_code);
  const badgeLabel = placement.badge_text || "Affiliate";
  const title = placement.title || placement.name || "Featured offer";
  const description = placement.description || "";
  const ctaLabel = placement.cta_text || "Check price";
  const subtext =
    placement.cta_subtext || placement.disclosure_text || "Affiliate link";
  const storeName = placement.store_name || "";

  if (variant === "listing-card") {
    return (
      <div
        className={`rounded-[22px] border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-50 p-3 ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                {badgeLabel}
              </span>
              {storeName ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <FaStore className="text-[10px] text-emerald-500" />
                  {storeName}
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-sm font-semibold leading-6 text-slate-900">
              {title}
            </div>
            {priceLabel ? (
              <div className="mt-1 text-sm font-semibold text-emerald-600">
                {priceLabel}
              </div>
            ) : null}
            <div className="mt-1 text-xs text-slate-500">{subtext}</div>
          </div>

          <a
            href={href}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            {ctaLabel}
            <FaExternalLinkAlt className="text-[10px]" />
          </a>
        </div>
      </div>
    );
  }

  if (variant === "listing-featured") {
    return (
      <div
        className={`overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-sm ${className}`}
      >
        <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="h-full min-h-[180px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[180px] items-center justify-center">
                <div className="rounded-full bg-white/10 p-4">
                  <FaStore className="text-xl text-white/90" />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                {badgeLabel}
              </span>
              {storeName ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {storeName}
                </span>
              ) : null}
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">
                {title}
              </h3>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-4">
              <div>
                {priceLabel ? (
                  <div className="text-lg font-semibold text-emerald-600">
                    {priceLabel}
                  </div>
                ) : null}
                <div className="text-sm text-slate-500">{subtext}</div>
              </div>
              <a
                href={href}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {ctaLabel}
                <FaArrowRight className="text-xs" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "news") {
    return (
      <aside
        className={`overflow-hidden border border-[#dbe7f7] bg-[#f7fbff] ${className}`}
      >
        <div className="grid gap-0 sm:grid-cols-[180px_minmax(0,1fr)]">
          <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="h-full min-h-[170px] w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[170px] items-center justify-center">
                <div className="bg-white/10 p-4">
                  <FaLink className="text-xl text-white/90" />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center bg-[#1d4ed8] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                {badgeLabel}
              </span>
              {storeName ? (
                <span className="inline-flex items-center bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-[#dbe7f7]">
                  {storeName}
                </span>
              ) : null}
            </div>

            <div>
              <h3 className="text-[20px] font-semibold leading-8 text-[#0f172a]">
                {title}
              </h3>
              {description ? (
                <p className="mt-2 text-[15px] leading-7 text-[#475569]">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-4 ring-1 ring-[#e2e8f0]">
              <div>
                {priceLabel ? (
                  <div className="text-lg font-semibold text-emerald-600">
                    {priceLabel}
                  </div>
                ) : null}
                <div className="text-sm text-slate-500">{subtext}</div>
              </div>
              <a
                href={href}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e293b]"
              >
                {ctaLabel}
                <FaExternalLinkAlt className="text-[11px]" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="h-full min-h-[190px] w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[190px] items-center justify-center">
              <div className="rounded-full bg-white/10 p-4">
                <FaStore className="text-xl text-white/90" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
              {badgeLabel}
            </span>
            {storeName ? (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {storeName}
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              {title}
            </h3>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-slate-50 px-4 py-4">
            <div>
              {priceLabel ? (
                <div className="text-lg font-semibold text-emerald-600">
                  {priceLabel}
                </div>
              ) : null}
              <div className="text-sm text-slate-500">{subtext}</div>
            </div>
            <a
              href={href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              {ctaLabel}
              <FaArrowRight className="text-xs" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliatePlacementCard;
