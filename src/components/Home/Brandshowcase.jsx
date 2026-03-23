import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import {
  FaExchangeAlt,
  FaArrowRight,
  FaMobileAlt,
  FaChartLine,
} from "react-icons/fa";
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
      className={`px-4 lg:px-4 mx-auto bg-white max-w-6xl w-full m-0 overflow-hidden pt-8 sm:pt-12 pb-6 sm:pb-10 transition-all duration-700 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      } ${className}`}
    >
      {/* Header Section - Enhanced */}
      <div className="mb-8 px-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                <FaChartLine className="text-lg text-blue-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                Top{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                  Gadget Comparisons
                </span>
              </h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed ml-11">
              Explore the most compared smartphones, laptops, appliances, and
              networking devices. Find the perfect match for your needs.
            </p>
          </div>

          <Link
            to="/popular-comparisons"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
            aria-label="View all popular comparisons"
          >
            View All
            <FaArrowRight className="text-xs transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Comparisons Row - Enhanced */}
      <div className="flex overflow-x-auto no-scrollbar hide-scrollbar gap-4 sm:gap-5 pb-6 px-2">
        {data.slice(0, 24).map((item, index) => (
          <Link
            key={`${item.left_id}-${item.right_id}-${index}`}
            to={`/compare?devices=${item.left_id}:0,${item.right_id}:0`}
            className={`group flex-shrink-0 transition-all duration-500 ${
              isLoaded ? "opacity-100 " : "opacity-0"
            }`}
            style={{ transitionDelay: `${index * 40}ms` }}
          >
            {/* Comparison Card - Professional Design */}
            <div
              className={`relative h-full bg-white border border-gray-200 hover:border-blue-300 p-4 sm:p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-100 w-[280px] sm:w-[320px] md:w-[360px] rounded-xl overflow-hidden group-hover:-translate-y-1 ${
                isFlat ? "" : ""
              }`}
            >
              {/* Background Gradient Accent */}
              <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-3xl"></div>

              {/* Devices Row - Enhanced */}
              <div className="flex flex-col gap-4 relative z-10">
                {/* Left Device - Professional */}
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 group-hover:border-blue-300 group-hover:shadow-md transition-all duration-300 flex items-center justify-center">
                    {item.left_image ? (
                      <img
                        src={item.left_image}
                        alt={item.left_name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <FaMobileAlt className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                      Device
                    </p>
                    <h6 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-tight hover:text-blue-600 transition-colors">
                      {item.left_name}
                    </h6>
                  </div>
                </div>

                {/* VS Badge - Professional */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold shadow-md group-hover:shadow-lg transition-shadow">
                    VS
                  </div>
                </div>

                {/* Right Device - Professional */}
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden p-2 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 group-hover:border-blue-300 group-hover:shadow-md transition-all duration-300 flex items-center justify-center order-2">
                    {item.right_image ? (
                      <img
                        src={item.right_image}
                        alt={item.right_name}
                        className="h-full w-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <FaMobileAlt className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 order-1">
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-0.5">
                      Compared With
                    </p>
                    <h6 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-tight hover:text-blue-600 transition-colors">
                      {item.right_name}
                    </h6>
                  </div>
                </div>
              </div>

              {/* CTA Footer - Professional */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between group/btn">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {item.compare_count > 0 &&
                    `${item.compare_count.toLocaleString()} imports`}
                </span>
                <FaArrowRight className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300 text-sm" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State - Professional */}
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 mb-4 border border-blue-200">
            <FaExchangeAlt className="text-blue-600 text-2xl" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            No Comparisons Available Yet
          </h3>
          <p className="text-gray-600 text-sm text-center max-w-sm mb-6">
            Be the first to compare devices! Explore and contrast the latest
            smartphones, laptops, and gadgets.
          </p>
          <Link
            to="/compare"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-200 transition-all duration-300 hover:-translate-y-0.5"
          >
            Start Comparing
            <FaArrowRight className="text-sm" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default PopularComparisons;
