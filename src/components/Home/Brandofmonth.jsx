// src/components/MobileFeaturesFinder.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaChartLine, FaFire, FaMobileAlt, FaSearch } from "react-icons/fa";
import { useDevice } from "../../hooks/useDevice";
import useRevealAnimation from "../../hooks/useRevealAnimation";
import {
  computePopularSmartphoneFeatures,
  SMARTPHONE_FEATURE_CATALOG,
} from "../../utils/smartphonePopularFeatures";
import { buildSmartphoneFeaturePath } from "../../utils/smartphoneListingRoutes";

const FeatureCard = ({ feature, index, isActive, isLoaded, onClick }) => {
  const Icon = feature.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`group relative h-[120px] w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl backdrop-blur-xl p-4 text-left transition-all duration-500 sm:w-[210px] lg:w-[225px] ${
        isActive
          ? "bg-white/25 text-slate-900 -translate-y-1 shadow-lg"
          : "bg-white/15 text-slate-700 hover:-translate-y-0.5 hover:bg-white/25"
      } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      style={{ transitionDelay: `${index * 45}ms` }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r from-slate-400/10 via-slate-300/5 to-slate-400/10 transition-opacity duration-300 ${
          isActive ? "opacity-20" : "opacity-0 group-hover:opacity-15"
        }`}
      />

      <div className="relative z-10 flex h-full items-center">
        <div className="flex w-full items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-br from-slate-700 to-slate-600 text-white ring-slate-500/40"
                  : "bg-white/30 text-slate-600 ring-slate-400/40 group-hover:bg-white/50 group-hover:text-slate-700"
              }`}
            >
              {Icon ? (
                <Icon className="h-5 w-5" />
              ) : (
                <FaMobileAlt className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold leading-tight text-slate-900">
                {feature.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

const MobileFeaturesFinder = () => {
  const navigate = useNavigate();
  const deviceCtx = useDevice();
  const smartphones = useMemo(
    () =>
      (deviceCtx.smartphoneAll && deviceCtx.smartphoneAll.length
        ? deviceCtx.smartphoneAll
        : deviceCtx.smartphone) || [],
    [deviceCtx.smartphoneAll, deviceCtx.smartphone],
  );

  const [activeFeature, setActiveFeature] = useState();
  const [params] = useSearchParams();
  const [popularFeatureOrder, setPopularFeatureOrder] = useState([]);
  const [popularFeatureOrderLoaded, setPopularFeatureOrderLoaded] =
    useState(false);
  const isLoaded = useRevealAnimation();

  useEffect(() => {
    let cancelled = false;
    const controller =
      typeof AbortController !== "undefined" ? new AbortController() : null;

    (async () => {
      try {
        const res = await fetch(
          "https://api.apisphere.in/api/public/popular-features?deviceType=smartphone&days=7&limit=16",
          controller ? { signal: controller.signal } : undefined,
        );
        if (!res.ok) return;
        const data = await res.json();
        const order = Array.isArray(data?.results)
          ? data.results
              .map((r) => r.feature_id || r.featureId || r.id)
              .filter(Boolean)
          : [];
        if (!cancelled) {
          setPopularFeatureOrder(order);
          setPopularFeatureOrderLoaded(true);
        }
      } catch {
        // ignore popularity fetch errors
      }
    })();

    return () => {
      cancelled = true;
      try {
        controller?.abort?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    const f = params.get("feature");
    setActiveFeature(f || undefined);
  }, [params]);

  const popularFeatures = useMemo(() => {
    const base = computePopularSmartphoneFeatures(smartphones, { limit: 0 });

    const normalizedActive = activeFeature
      ? activeFeature.toString().toLowerCase().replace(/\s+/g, "-")
      : null;

    let features = base;
    if (normalizedActive && !features.some((f) => f.id === normalizedActive)) {
      const def = SMARTPHONE_FEATURE_CATALOG.find(
        (f) => f.id === normalizedActive,
      );
      if (def) features = [{ ...def, count: 0 }, ...features];
    }

    if (popularFeatureOrder && popularFeatureOrder.length) {
      const byId = new Map(features.map((f) => [f.id, f]));
      const ordered = [];
      for (const id of popularFeatureOrder) {
        if (!byId.has(id)) continue;
        ordered.push(byId.get(id));
        byId.delete(id);
      }
      ordered.push(...byId.values());
      features = ordered;
    }

    return features.slice(0, 16);
  }, [smartphones, activeFeature, popularFeatureOrder]);

  const trackFeatureClick = (featureId) => {
    try {
      const url = "https://api.apisphere.in/api/public/feature-click";
      const body = new URLSearchParams({
        device_type: "smartphone",
        feature_id: featureId,
      });
      if (navigator && typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon(url, body);
        return;
      }
    } catch {
      // fall back to fetch
    }

    try {
      fetch("https://api.apisphere.in/api/public/feature-click", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: new URLSearchParams({
          device_type: "smartphone",
          feature_id: featureId,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const handleFeatureClick = (featureId) => {
    setActiveFeature(featureId);
    trackFeatureClick(featureId);
    navigate(buildSmartphoneFeaturePath(featureId));
  };

  const handleViewAll = () => {
    navigate("/smartphones");
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-white via-slate-50 to-white text-slate-900">
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(10px); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-40px) translateX(-15px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 8s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glow-pulse 4s ease-in-out infinite;
        }
      `}</style>

      {/* Premium animated glass orbs */}
      <div className="absolute -top-20 -left-32 h-96 w-96 rounded-full bg-gradient-to-br from-slate-300/35 to-slate-200/15 blur-3xl animate-float-slow" />
      <div
        className="absolute -bottom-32 -right-40 h-96 w-96 rounded-full bg-gradient-to-tl from-slate-400/30 to-slate-300/10 blur-3xl animate-float-slower"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-gradient-to-r from-slate-300/25 to-transparent blur-3xl animate-glow-pulse"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute top-1/2 right-1/4 h-80 w-80 rounded-full bg-gradient-to-l from-slate-300/20 to-transparent blur-3xl animate-float-slow"
        style={{ animationDelay: "2s" }}
      />

      {/* Accent floating elements */}
      <div
        className="absolute top-1/4 right-1/3 h-2 w-2 rounded-full bg-slate-400/40 blur-sm animate-float-slow"
        style={{ animationDelay: "0.3s" }}
      />
      <div
        className="absolute bottom-1/3 left-1/3 h-3 w-3 rounded-full bg-slate-300/30 blur-sm animate-float-slower"
        style={{ animationDelay: "1.5s" }}
      />

      {/* Enhanced grid pattern */}
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(100,116,139,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.1)_1px,transparent_1px)] [background-size:60px_60px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-6 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Mobiles by
            <span className="ml-2 bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-600 bg-clip-text text-transparent animate-pulse">
              Popular Features
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base lg:text-lg">
            {popularFeatureOrderLoaded
              ? "Popular choices from other users in the last 7 days."
              : "Find smartphones based on the features people search for most."}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 overflow-x-auto pb-1 text-slate-700 no-scrollbar">
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">
            <FaChartLine className="h-3.5 w-3.5 text-slate-500" />
            Trending
          </span>

          {popularFeatures.slice(0, 6).map((feature) => (
            <button
              key={feature.id}
              type="button"
              onClick={() => handleFeatureClick(feature.id)}
              className="whitespace-nowrap rounded-full border border-slate-400/40 bg-white/20 backdrop-blur-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500/60 hover:bg-white/35 hover:text-slate-900"
            >
              {feature.name}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
          <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
            <FaFire className="h-3.5 w-3.5 text-slate-500" />
            Featured Picks on Hooks
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-300/50 to-transparent" />
        </div>

        <div className="mx-auto mt-8 max-w-6xl">
          <div className="no-scrollbar flex w-full flex-nowrap gap-3 overflow-x-auto pb-4 pt-0 snap-x snap-mandatory">
            {popularFeatures.map((feature, index) => {
              const isActive = activeFeature === feature.id;
              return (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  index={index}
                  isActive={isActive}
                  isLoaded={isLoaded}
                  onClick={() => handleFeatureClick(feature.id)}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-10 hidden flex-col items-center gap-5 rounded-2xl border border-slate-400/40 bg-white/20 backdrop-blur-lg px-5 py-5 text-slate-900 transition-all duration-300 hover:border-slate-500/60 hover:bg-white/30 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">
              Need a shortcut?
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Open the full catalog or jump straight to feature filters.
            </p>
          </div>

          <button
            type="button"
            onClick={handleViewAll}
            className="group mx-auto inline-flex w-fit rounded-full bg-gradient-to-r from-slate-700 to-slate-600 p-[1px] transition-all duration-500 hover:shadow-lg hover:from-slate-600 hover:to-slate-500 sm:mx-0"
          >
            <span className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 transition-all duration-300 group-hover:gap-3">
              <span className="font-semibold leading-none text-slate-700">
                View All Phones
              </span>
              <FaSearch className="h-4 w-4 shrink-0 text-slate-600 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default MobileFeaturesFinder;
