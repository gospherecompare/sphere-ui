import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaMobile } from "react-icons/fa";
import { buildApiUrl } from "../../utils/apiUrl";
import { createSmartphoneDetailPath } from "../../utils/slugGenerator";
import "../../styles/hideScrollbar.css";

const RECENT_STORAGE_KEY = "hooks_recent_smartphones_v1";
const MAX_RECENT_ITEMS = 12;

const formatPrice = (value) => {
  if (value == null || value === "") return "";
  const text = String(value);
  if (text.includes("₹")) return text;
  const numeric = Number(text.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(numeric)
    : text;
};

const ContinueBrowsingSmartphones = ({
  currentProduct = null,
  transparentBackground = false,
}) => {
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [activeTab, setActiveTab] = useState("recent");
  const [products, setProducts] = useState({ trending: [], mostSearched: [] });
  const [status, setStatus] = useState({
    trending: "idle",
    mostSearched: "idle",
  });
  const [retryCount, setRetryCount] = useState(0);
  const requestedRef = useRef({ trending: false, mostSearched: false });
  const recordedProductRef = useRef("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(RECENT_STORAGE_KEY);
      const parsed = JSON.parse(raw || "[]");
      const list = Array.isArray(parsed) ? parsed : [];

      if (currentProduct?.id) {
        const entryKey = String(currentProduct.id);
        if (recordedProductRef.current !== entryKey) {
          recordedProductRef.current = entryKey;
          const entry = { ...currentProduct, visitedAt: Date.now() };
          const next = [
            entry,
            ...list.filter((item) => String(item?.id) !== entryKey),
          ].slice(0, MAX_RECENT_ITEMS);
          window.localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
          setRecentlyViewed(
            next.filter((item) => String(item?.id) !== entryKey).slice(0, 6),
          );
          return;
        }
      }

      setRecentlyViewed(
        list
          .filter(
            (item) => String(item?.id) !== String(currentProduct?.id ?? ""),
          )
          .slice(0, 6),
      );
    } catch {
      setRecentlyViewed([]);
    }
  }, [currentProduct]);

  useEffect(() => {
    if (activeTab === "recent") return undefined;
    const dataKey = activeTab === "trending" ? "trending" : "mostSearched";
    if (requestedRef.current[dataKey]) return undefined;

    requestedRef.current[dataKey] = true;
    setStatus((current) => ({ ...current, [dataKey]: "loading" }));
    const endpoint =
      dataKey === "trending"
        ? "/public/trending/smartphones/views?limit=12"
        : "/public/most-searched/smartphones?limit=12&days=30";

    fetch(buildApiUrl(endpoint))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            `Could not load ${dataKey} smartphones (${response.status})`,
          );
        }
        return response.json();
      })
      .then((payload) => {
        const rows =
          payload?.smartphones ||
          payload?.trending ||
          payload?.devices ||
          payload?.data ||
          [];
        setProducts((current) => ({
          ...current,
          [dataKey]: Array.isArray(rows) ? rows : [],
        }));
        setStatus((current) => ({ ...current, [dataKey]: "loaded" }));
      })
      .catch((error) => {
        console.error(`Continue browsing ${dataKey} load failed:`, error);
        requestedRef.current[dataKey] = false;
        setStatus((current) => ({ ...current, [dataKey]: "error" }));
      });
    return undefined;
  }, [activeTab, retryCount]);

  const dataKey =
    activeTab === "trending" ? "trending" : "mostSearched";
  const isRemoteTab = activeTab !== "recent";
  const activeProducts = isRemoteTab ? products[dataKey] : recentlyViewed;
  const viewAllHref =
    activeTab === "trending"
      ? "/trending/smartphones"
      : activeTab === "most-searched"
        ? "/smartphones?sort=most-searched"
        : "/smartphones";

  return (
    <section
      className={`w-full ${transparentBackground ? "bg-transparent" : "bg-white"}`}
    >
      <div className="mx-auto w-full max-w-[1440px] px-3 pb-10 pt-6 sm:px-6 sm:pb-12 lg:px-8">
        <div className="mx-auto w-full max-w-7xl bg-transparent">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-blue-600">
                Continue browsing
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                {activeTab === "recent"
                  ? "Recently viewed smartphones"
                  : activeTab === "trending"
                    ? "Trending smartphones"
                    : "Most searched smartphones"}
              </h2>
            </div>
            <Link
              to={viewAllHref}
              className="hidden items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 sm:inline-flex"
            >
              View all
              <FaArrowRight className="text-xs" />
            </Link>
          </div>

          <div
            className="mt-4 flex gap-2 border-b border-slate-100"
            role="tablist"
            aria-label="Continue browsing smartphone lists"
          >
            {[
              { id: "recent", label: "Recent visits" },
              { id: "trending", label: "Trending" },
              { id: "most-searched", label: "Most searched" },
            ].map((tab) => (
              <button
                key={tab.id}
                id={`continue-browsing-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="continue-browsing-panel"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-10 border-b-2 px-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-500">
            {activeTab === "recent"
              ? "Pick up where you left off."
              : activeTab === "trending"
                ? "Smartphones getting the most product views over the last 7 days."
                : "Smartphones receiving the most product-search interest over the last 30 days."}
          </p>

          <div
            id="continue-browsing-panel"
            role="tabpanel"
            aria-labelledby={`continue-browsing-tab-${activeTab}`}
            className="min-h-[112px]"
          >
            {isRemoteTab && status[dataKey] === "loading" ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading smartphones...
              </p>
            ) : isRemoteTab && status[dataKey] === "error" ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-600">
                  This list could not be loaded.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    requestedRef.current[dataKey] = false;
                    setStatus((current) => ({ ...current, [dataKey]: "idle" }));
                    setRetryCount((count) => count + 1);
                  }}
                  className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Try again
                </button>
              </div>
            ) : activeProducts.length ? (
              <div className="no-scrollbar mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-4">
                {activeProducts.map((item) => {
                  const itemName =
                    item?.name || item?.product_name || "Smartphone";
                  const href = createSmartphoneDetailPath(
                    item?.model ||
                      item?.product_name ||
                      item?.productName ||
                      itemName,
                  );
                  const image = item?.image || item?.image_url || item?.images?.[0];
                  const itemPrice = item?.price || item?.starting_price;

                  return (
                    <Link
                      key={String(item?.id || item?.product_id || itemName)}
                      to={href}
                      className={`grid w-[230px] shrink-0 snap-start grid-cols-[64px_minmax(0,1fr)] items-center gap-3 rounded-xl p-3 transition ${
                        transparentBackground
                          ? "bg-transparent hover:bg-transparent"
                          : "bg-white hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                        {image ? (
                          <img
                            src={image}
                            alt={itemName}
                            loading="lazy"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <FaMobile className="text-xl text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {itemName}
                        </p>
                        {item?.brand || item?.brand_name ? (
                          <p className="mt-0.5 truncate text-[11px] text-slate-500">
                            {item.brand || item.brand_name}
                          </p>
                        ) : null}
                        {itemPrice ? (
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {String(itemPrice).includes("₹")
                              ? itemPrice
                              : `₹${formatPrice(itemPrice)}`}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                {activeTab === "recent"
                  ? "Your recently viewed phones will appear here."
                  : activeTab === "trending"
                    ? "There are no trending phones to show yet."
                    : "No smartphone search activity is available yet."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContinueBrowsingSmartphones;
