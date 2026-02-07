import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { FaExchangeAlt, FaArrowRight, FaMobileAlt } from "react-icons/fa";

const PopularComparisons = ({ data: initialData = [] }) => {
  const [data, setData] = useState(initialData || []);

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
    <div className="px-2 lg:px-4 mx-auto bg-white max-w-6xl rounded-lg w-full m-0 overflow-hidden pt-5 sm:pt-10">
      {/* Header Section */}
      <div className="mb-6 px-2">
        <div className="flex items-center gap-2 mb-2">
          <FaExchangeAlt className="text-purple-500 text-lg" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Popular{" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              Comparisons
            </span>
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          See what devices users are comparing the most
        </p>
      </div>

      {/* Comparisons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 pb-6">
        {data.slice(0, 24).map((item, index) => (
          <Link
            key={`${item.left_id}-${item.right_id}-${index}`}
            to={`/compare?devices=${item.left_id}:0,${item.right_id}:0`}
            className="group transition-all duration-300 hover:transform hover:-translate-y-1"
          >
            {/* Comparison Card */}
            <div className="relative bg-gray-100 rounded-xl p-1 sm:p-3 transition-all duration-300 group-hover:shadow-lg group-hover:border-blue-300 h-12 sm:h-14">
              {/* Devices Row */}
              <div className="flex items-center justify-between">
                {/* Left Device */}
                <div className="flex-1 pr-2 sm:pr-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-full    p-0.5 sm:p-1">
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
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <FaMobileAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      )}
                    </div>
                    <h6 className="text-[11px] sm:text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {item.left_name}
                    </h6>
                  </div>
                </div>

                {/* VS Badge */}
                <div className="relative">
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] font-bold bg-gray-100 text-purple-600 px-2 py-0.5 rounded-full">
                    VS
                  </div>
                </div>

                {/* Right Device */}
                <div className="flex-1 pl-2 sm:pl-4">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-row-reverse">
                    <div className="h-7 w-7 sm:h-9 sm:w-9 shrink-0 overflow-hidden rounded-full p-0.5 sm:p-1">
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
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <FaMobileAlt className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      )}
                    </div>
                    <h6 className="text-[11px] sm:text-sm font-semibold text-gray-900 truncate text-right group-hover:text-purple-600 transition-colors">
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
