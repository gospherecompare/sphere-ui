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
import {
  HOME_SECTION_LEAD_LIGHT,
  HOME_SECTION_TITLE_LIGHT,
} from "./homeSectionTypography";

const FeatureCard = ({ feature, index, isActive, isLoaded, onClick }) => {
  const Icon = feature.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`group relative h-[120px] w-[200px] shrink-0 snap-start overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all duration-500 sm:w-[210px] lg:w-[225px] ${
        isActive
          ? "border-blue-200 bg-blue-50 text-slate-900 -translate-y-1 shadow-md"
          : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
      } ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
      style={{ transitionDelay: `${index * 45}ms` }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r from-blue-50 via-transparent to-cyan-50 transition-opacity duration-300 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      />

      <div className="relative z-10 flex h-full items-center">
        <div className="flex w-full items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 transition-all duration-300 ${
                isActive
                  ? "bg-blue-600 text-white ring-blue-100"
                  : "bg-slate-100 text-slate-600 ring-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600"
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
    <section className="relative overflow-hidden border-t border-slate-200 bg-white text-slate-900">
      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-20 lg:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className={HOME_SECTION_TITLE_LIGHT}>
            <span className="block">Find Phones by</span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-cyan-600 bg-clip-text text-transparent animate-pulse">
              Popular Features
            </span>
          </h2>

          <p className={HOME_SECTION_LEAD_LIGHT}>
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
              className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
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

        <div className="mt-10 hidden flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
