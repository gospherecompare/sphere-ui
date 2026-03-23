import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FaExchangeAlt, FaArrowRight, FaMobileAlt } from "react-icons/fa";
import useRevealAnimation from "../../hooks/useRevealAnimation";

const PopularComparisons = ({
  data: initialData = [],
  variant = "default",
  className = "",
}) => {
  const [data, setData] = useState(initialData || []);
  const isFlat = variant === "flat";
  const isLoaded = useRevealAnimation();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "https://api.apisphere.in/api/public/trending/most-compared",
        );
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;

        const mapped = (json.mostCompared || []).map((r) => ({
          left_id: r.product_id,
          left_name: r.product_name,
          left_image: r.product_image || null,
          right_id: r.compared_product_id,
          right_name: r.compared_product_name,
          right_image: r.compared_product_image || null,
          compare_count: Number(r.compare_count) || 0,
        }));
        setData(mapped);
      } catch (err) {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={`px-4 lg:px-4 mx-auto bg-white max-w-4xl w-full m-0 overflow-hidden pt-5 sm:pt-10 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${isFlat && ""} ${className}`}
    >
      {/* Header Section */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 leading-tight">
            Top{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Gadget Comparisons
            </span>
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-600 leading-snug">
          Compare top smartphones, laptops, appliances, and networking devices
          side by side
        </p>
        <div>
          <Link
            to="/popular-comparisons"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All Comparisons
            <FaArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Comparisons Row */}
      <div className="flex overflow-x-auto no-scrollbar hide-scrollbar gap-3 sm:gap-3 lg:gap-4 pb-6">
        {data.slice(0, 24).map((item, index) => (
          <Link
            key={`${item.left_id}-${item.right_id}-${index}`}
            to={`/compare?devices=${item.left_id}:0,${item.right_id}:0`}
            className={`group w-[320px] sm:w-[360px] md:w-[420px] shrink-0 transition-all duration-500 ${
              isLoaded ? "opacity-100 " : "opacity-0"
            }`}
            style={{ transitionDelay: `${index * 40}ms` }}
          >
            {/* Comparison Card */}
            <div
              className={`relative bg-white border border-gray-100 p-2 sm:p-1 transition-all duration-300  ${
                isFlat ? "" : "rounded-md"
              }`}
            >
              {/* Devices Row */}
              <div className="flex items-center justify-between">
                {/* Left Device */}
                <div className="flex-1 pr-2 sm:pr-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div
                      className={`h-10 w-10 sm:h-10 sm:w-10 shrink-0 overflow-hidden p-0.5 sm:p-1 ${
                        isFlat ? "" : "rounded-full"
                      }`}
                    >
                      {item.left_image ? (
                        <img
                          src={item.left_image}
                          alt={item.left_name}
                          className="h-full w-full object-contain bg-gray-100 p-1"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <FaMobileAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      )}
                    </div>
                    <h6 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-900 truncate transition-colors line-clamp-2">
                      {item.left_name}
                    </h6>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="relative">
                  <div
                    className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-bold bg-gray-100 text-purple-600 px-2 py-0.5 ${
                      isFlat ? "" : "rounded-full"
                    }`}
                  >
                    VS
                  </div>
                </div>

                {/* Right Device */}
                <div className="flex-1 pl-2 sm:pl-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-row-reverse">
                    <div
                      className={`h-10 w-10 sm:h-10 sm:w-10 shrink-0 overflow-hidden p-0.5 sm:p-1 ${
                        isFlat ? "" : "rounded-full"
                      }`}
                    >
                      {item.right_image ? (
                        <img
                          src={item.right_image}
                          alt={item.right_name}
                          className="h-full w-full object-contain bg-gray-100 p-1"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <FaMobileAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      )}
                    </div>
                    <h6 className="text-[11px] sm:text-sm font-semibold text-gray-900 truncate text-right">
                      {item.right_name}
                    </h6>
                  </div>
                </div>
              </div>

              {/* Comparison Stats */}

              {/* Comparison Visual Indicator */}
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-8 px-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
            <FaExchangeAlt className="text-blue-500 text-lg" />
          </div>
          <p className="text-gray-600 font-medium text-sm">
            No comparisons available yet
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Be the first to compare devices!
          </p>
        </div>
      )}
    </div>
  );
};

export default PopularComparisons;
