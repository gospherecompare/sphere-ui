import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "https://api.apisphere.in";

const DEFAULT_SIZES = {
  top_leaderboard: { desktop: "970x90", tablet: "728x90", mobile: "320x50" },
  left_sidebar: { desktop: "160x600", tablet: "160x600", mobile: "" },
  right_sidebar: { desktop: "160x600", tablet: "160x600", mobile: "" },
  in_content: { desktop: "300x250", tablet: "300x250", mobile: "320x100" },
  footer_leaderboard: { desktop: "970x90", tablet: "728x90", mobile: "320x50" },
  mobile_sticky: { desktop: "", tablet: "", mobile: "320x50" },
};

const getFallbackSizeValue = (placement, viewport) => {
  const fallback = DEFAULT_SIZES[placement] || {};
  if (viewport === "desktop") return fallback.desktop || "";
  if (viewport === "tablet") return fallback.tablet || "";
  return fallback.mobile || "";
};

const parseSize = (value) => {
  if (!value) return { width: null, height: null };
  const m = String(value).match(/(\d{2,4})\s*x\s*(\d{2,4})/i);
  if (!m) return { width: null, height: null };
  return { width: Number(m[1]), height: Number(m[2]) };
};

const getViewport = () => {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w >= 1024) return "desktop";
  if (w >= 768) return "tablet";
  return "mobile";
};

const BannerSlot = ({
  placement,
  className = "",
  sticky = false,
  align = "center",
  fill = false,
  showLabel = false,
}) => {
  const resolvedPlacement = placement || (sticky ? "mobile_sticky" : "");

  const [banner, setBanner] = useState(null);
  const [viewport, setViewport] = useState(getViewport());
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const onResize = () => setViewport(getViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!resolvedPlacement) return;
    const controller = new AbortController();
    const fetchBanner = async () => {
      try {
        setStatus("loading");
        setBanner(null);
        const res = await fetch(
          `${API_BASE}/api/public/banners?placement=${encodeURIComponent(resolvedPlacement)}&limit=1`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setStatus("empty");
          return;
        }
        const data = await res.json();
        const row = Array.isArray(data?.banners) ? data.banners[0] : null;
        setBanner(row || null);
        setStatus(row ? "ready" : "empty");
      } catch {
        if (!controller.signal.aborted) setStatus("empty");
      }
    };
    fetchBanner();
    return () => controller.abort();
  }, [resolvedPlacement]);

  // ── Derived size values ──────────────────────────────────────────────────

  const fallbackSizeValue = useMemo(
    () =>
      resolvedPlacement
        ? getFallbackSizeValue(resolvedPlacement, viewport)
        : "",
    [resolvedPlacement, viewport],
  );

  const sizeValue = useMemo(() => {
    if (!resolvedPlacement) return "";
    if (!banner) return fallbackSizeValue;
    if (viewport === "desktop") return banner.size_desktop || fallbackSizeValue;
    if (viewport === "tablet") return banner.size_tablet || fallbackSizeValue;
    return banner.size_mobile || fallbackSizeValue;
  }, [banner, fallbackSizeValue, resolvedPlacement, viewport]);

  const fallbackDimensions = useMemo(
    () => parseSize(fallbackSizeValue),
    [fallbackSizeValue],
  );

  const { width, height } = useMemo(() => {
    let { width, height } = parseSize(sizeValue);
    width = width || fallbackDimensions.width;
    height = height || fallbackDimensions.height;

    const isSb =
      resolvedPlacement === "right_sidebar" ||
      resolvedPlacement === "left_sidebar";
    if (isSb && width && height && height <= 120) {
      const forced = parseSize(
        DEFAULT_SIZES[resolvedPlacement]?.desktop || "160x600",
      );
      width = forced.width;
      height = forced.height;
    }
    return { width, height };
  }, [sizeValue, fallbackDimensions, resolvedPlacement]);

  const aspectRatio = useMemo(() => {
    if (width && height) return `${width}/${height}`;
    if (fallbackDimensions.width && fallbackDimensions.height)
      return `${fallbackDimensions.width}/${fallbackDimensions.height}`;
    return undefined;
  }, [width, height, fallbackDimensions]);

  // ── Layout type flags ────────────────────────────────────────────────────
  const isSidebar =
    resolvedPlacement === "right_sidebar" ||
    resolvedPlacement === "left_sidebar";
  const isLeaderboard =
    resolvedPlacement === "top_leaderboard" ||
    resolvedPlacement === "footer_leaderboard";
  const isSticky = sticky || resolvedPlacement === "mobile_sticky";
  const isInContent = !isSidebar && !isLeaderboard && !isSticky;

  const hasMedia = Boolean(banner?.media_url);
  const showSkeleton = status === "loading" && !hasMedia;
  const isVisible = hasMedia || showSkeleton;

  const isVideo =
    banner?.media_type?.startsWith("video") ||
    /\.(mp4|webm|mov|m4v)$/i.test(banner?.media_url || "");

  const alignClass =
    align === "left"
      ? "justify-start"
      : align === "right"
        ? "justify-end"
        : "justify-center";

  // ── Single return ────────────────────────────────────────────────────────
  return isVisible ? (
    <div
      className={[
        isSidebar && `flex-shrink-0 hidden lg:block ${className}`,
        isLeaderboard && className,
        isSticky && "fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 sm:hidden",
        isInContent && className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={isSidebar ? { width: width ?? 160 } : undefined}
    >
      {/* Alignment row (leaderboard, sticky, in-content) */}
      <div
        className={[
          isLeaderboard && `flex ${alignClass}`,
          isSticky && "flex justify-center",
          isInContent && `flex ${alignClass}`,
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          isInContent
            ? !fill && width
              ? { width, maxWidth: width }
              : { width: "100%", maxWidth: "100%" }
            : undefined
        }
      >
        {/* Slot frame */}
        <div
          className="relative overflow-hidden"
          style={
            isSidebar
              ? { width: width ?? 160, minHeight: height ?? 600, aspectRatio }
              : isLeaderboard
                ? fill
                  ? {
                      width: "100%",
                      aspectRatio: aspectRatio || "970/90",
                      minHeight: height ?? 90,
                    }
                  : {
                      width: width ?? "100%",
                      maxWidth: width ?? "100%",
                      aspectRatio: aspectRatio || "970/90",
                      minHeight: height ?? 90,
                    }
                : isSticky
                  ? { width: width ?? 320, height: height ?? 50, aspectRatio }
                  : fill
                    ? width && height
                      ? { width: "100%", aspectRatio: `${width}/${height}` }
                      : { width: "100%" }
                    : {
                        width: "100%",
                        aspectRatio,
                        height: aspectRatio ? undefined : height,
                      }
          }
        >
          {/* Ad label */}
          {showLabel && (
            <span className="absolute left-2 top-2 z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 shadow">
              Ad
            </span>
          )}

          {/* Media */}
          {hasMedia &&
            (banner?.link_url ? (
              <a
                href={banner.link_url}
                target="_blank"
                rel="noreferrer noopener"
                className="block h-full w-full"
                aria-label={
                  banner.title
                    ? `Advertisement: ${banner.title}`
                    : "Advertisement"
                }
              >
                {isVideo ? (
                  <video
                    src={banner.media_url}
                    muted
                    autoPlay
                    loop
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={banner.media_url}
                    alt={banner.title || "Advertisement"}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                )}
              </a>
            ) : isVideo ? (
              <video
                src={banner.media_url}
                muted
                autoPlay
                loop
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              <img
                src={banner.media_url}
                alt={banner.title || "Advertisement"}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain"
              />
            ))}

          {/* Skeleton */}
          {showSkeleton && (
            <div
              aria-hidden
              className="h-full w-full animate-pulse bg-gray-100"
            />
          )}
        </div>
      </div>
    </div>
  ) : null;
};

export default BannerSlot;

/* -------------------------------------------------------------------------
   PageLayout – drop-in wrapper that mirrors 91mobiles structure

   Usage:
     <PageLayout>
       <YourPageContent />
     </PageLayout>
------------------------------------------------------------------------- */
export const PageLayout = ({ children }) => (
  <div className="min-h-screen">
    {/* Top Leaderboard */}
    <div>
      <BannerSlot placement="top_leaderboard" align="center" />
    </div>

    {/* Three-column body: left sidebar | main content | right sidebar */}
    <div className="flex items-start  mx-auto px-2 gap-3 py-3">
      {/* Left Sidebar – 160px, hidden below lg */}
      <aside
        className="hidden lg:block flex-shrink-0 bg-yellow-200"
        style={{ width: 100 }}
      >
        <div className="sticky top-3">
          <BannerSlot placement="left_sidebar" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">{children}</main>

      {/* Right Sidebar – 160px, hidden below lg */}
      <aside
        className="hidden lg:block flex-shrink-0 bg-yellow-200"
        style={{ width: 160 }}
      >
        <div className="sticky top-3">
          <BannerSlot placement="right_sidebar" />
        </div>
      </aside>
    </div>

    {/* Footer Leaderboard */}
    <div className="border-t border-gray-200 bg-gray-50 py-2 mt-4">
      <BannerSlot placement="footer_leaderboard" align="center" />
    </div>

    {/* Mobile sticky */}
    <BannerSlot placement="mobile_sticky" sticky />
  </div>
);
