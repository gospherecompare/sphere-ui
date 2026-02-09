// src/components/MobileFeaturesFinder.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaMobileAlt } from "react-icons/fa";
import { useDevice } from "../../hooks/useDevice";
import {
  computePopularSmartphoneFeatures,
  SMARTPHONE_FEATURE_CATALOG,
} from "../../utils/smartphonePopularFeatures";

const MobileFeaturesFinder = () => {
  const navigate = useNavigate();
  const deviceCtx = useDevice();
  const smartphones =
    (deviceCtx.smartphoneAll && deviceCtx.smartphoneAll.length
      ? deviceCtx.smartphoneAll
      : deviceCtx.smartphone) || [];

  const [activeFeature, setActiveFeature] = useState();

  const [params] = useSearchParams();

  const [popularFeatureOrder, setPopularFeatureOrder] = useState([]);
  const [popularFeatureOrderLoaded, setPopularFeatureOrderLoaded] =
    useState(false);

  React.useEffect(() => {
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

  React.useEffect(() => {
    const f = params.get("feature");
    setActiveFeature(f || undefined);
  }, [params]);

  const popularFeatures = useMemo(() => {
    const base = computePopularSmartphoneFeatures(smartphones, { limit: 0 });

    const normalizedActive = activeFeature
      ? activeFeature.toString().toLowerCase().replace(/\s+/g, "-")
      : null;

    let features = base;
    if (
      normalizedActive &&
      !features.some((f) => f.id === normalizedActive)
    ) {
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
    navigate(`/smartphones?feature=${featureId}`);
  };

  const handleViewAll = () => {
    navigate("/smartphones");
  };

  return (
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-6xl w-full m-5 rounded-lg overflow-hidden pt-5 sm:pt-10">
      {/* Header Section */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 mb-2">
          <FaMobileAlt className="text-purple-500 text-lg" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Mobiles by{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Popular Features
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          {popularFeatureOrderLoaded
            ? "Popular choices from other users (last 7 days)"
            : "Find smartphones based on your preferred features"}
        </p>
      </div>

      {/* Features Grid - Single Row */}
      <div
        className="
    grid grid-cols-4
    sm:flex sm:overflow-x-auto sm:gap-4 sm:pb-6
    hide-scrollbar no-scrollbar scroll-smooth
  "
      >
        {popularFeatures.map((feature) => {
          const isActive = activeFeature === feature.id;
          const Icon = feature.icon;

          return (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature.id)}
              className={`flex flex-col items-center p-2 transition-all duration-300 min-w-[100px] lg:min-w-[120px] shrink-0 group ${
                isActive
                  ? "text-gray-900 transform -translate-y-1"
                  : "text-gray-600 hover:text-gray-900 hover:transform hover:scale-105"
              }`}
            >
              {/* Icon Container */}
              <div
                className={`w-14 h-14 lg:w-16 lg:h-16 flex items-center justify-center rounded-2xl p-3 transition-all duration-300 mb-3 ${
                  isActive
                    ? "bg-gradient-to-br from-blue-600 via-purple-500 to-blue-600 text-white shadow-lg shadow-red-200/50"
                    : "bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:shadow-md"
                }`}
              >
                <span
                  className={`text-xl lg:text-2xl transition-colors duration-300 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                >
                  {Icon ? <Icon /> : null}
                </span>
              </div>

              {/* Feature Name */}
              <span
                className={`font-bold text-xs lg:text-sm text-center transition-all duration-300 mb-1 ${
                  isActive
                    ? "text-gray-900"
                    : "text-gray-600 group-hover:text-gray-900"
                }`}
              >
                {feature.name}
              </span>

              {/* Feature Description */}
              <span className="text-[10px] text-gray-500 mb-2">
                {feature.description}
              </span>

              {/* Count Badge */}

              {/* Active Indicator Dot */}
              <div
                className={`mt-2 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 opacity-100"
                    : "bg-transparent opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* View All Button */}
    </div>
  );
};

export default MobileFeaturesFinder;
