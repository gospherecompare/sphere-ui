import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SEO from "../SEO";
import { buildApiUrl } from "../../utils/apiUrl";
import { useDevice } from "../../hooks/useDevice";

const PRICE_HISTORY_RANGES = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "ALL" },
];

const EMPTY_SUMMARY = {
  current_price: null,
  lowest_price: null,
  highest_price: null,
  average_price: null,
  previous_price: null,
  change_amount: null,
  change_percent: null,
};

const formatPrice = (price) => {
  const value = Number(price);
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)
    : "—";
};

const SmartphonePriceHistory = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchDevice } = useDevice({ resources: [] });
  const productId = Number(searchParams.get("productId"));
  const variantId = searchParams.get("variantId") || "";
  const requestedVariantLabel = searchParams.get("variantLabel") || "";
  const productPath = location.pathname.replace(/\/price-history\/?$/i, "");
  const [range, setRange] = useState("30d");
  const [store, setStore] = useState("mobilesx");
  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState("");
  const [history, setHistory] = useState([]);
  const [storeNames, setStoreNames] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) {
      setVariants([]);
      return undefined;
    }

    let active = true;
    const request = fetchDevice(productId);
    setVariantsLoading(true);
    setVariantsError("");

    request
      .unwrap()
      .then((product) => {
        if (active) {
          const availableVariants = Array.isArray(product?.variants)
            ? product.variants
            : [];
          setVariants(availableVariants);
        }
      })
      .catch((loadError) => {
        if (active) {
          console.error("Failed to load smartphone variants:", loadError);
          setVariantsError("Available variants could not be loaded.");
        }
      })
      .finally(() => {
        if (active) setVariantsLoading(false);
      });

    return () => {
      active = false;
      request.abort();
    };
  }, [fetchDevice, productId]);

  const variantLabelFor = (variant, index) => {
    const ram = String(variant?.ram ?? "").trim();
    const storage = String(variant?.storage ?? "").trim();
    const label = [ram, storage].filter(Boolean).join(" / ");
    return label || `Variant ${index + 1}`;
  };
  const selectedVariant = variants.find(
    (variant) =>
      String(variant?.variant_id ?? variant?.id ?? variant?.variantId) ===
      String(variantId),
  );
  const variantLabel = selectedVariant
    ? variantLabelFor(selectedVariant, variants.indexOf(selectedVariant))
    : requestedVariantLabel || "Selected variant";

  const selectVariant = (variant, index) => {
    const nextVariantId =
      variant?.variant_id ?? variant?.id ?? variant?.variantId;
    if (nextVariantId == null) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("variantId", String(nextVariantId));
    nextParams.set("variantLabel", variantLabelFor(variant, index));
    setSearchParams(nextParams, { replace: true });
  };

  const storeOptions = useMemo(() => {
    const uniqueStores = new Map();
    storeNames.forEach((name) => {
      const value = String(name || "").trim();
      if (value) uniqueStores.set(value.toLowerCase(), value);
    });
    return [
      { value: "mobilesx", label: "MobilesX" },
      ...Array.from(uniqueStores, ([value, label]) => ({ value, label })),
    ];
  }, [storeNames]);

  const chartData = useMemo(
    () =>
      history.map((entry) => ({
        date: new Date(entry.recorded_at).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        price: Number(entry.price),
      })),
    [history],
  );

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0 || !variantId) {
      setError("This price-history link is missing its product or variant.");
      setHistory([]);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const loadHistory = async () => {
      setLoading(true);
      setError("");

      try {
        const url = buildApiUrl(
          `/public/smartphone/${productId}/price-history?variant_id=${encodeURIComponent(variantId)}&range=${encodeURIComponent(range)}&store=${encodeURIComponent(store)}`,
        );
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load price history (${response.status})`);
        }
        const result = await response.json();
        if (!active) return;

        setHistory(Array.isArray(result?.history) ? result.history : []);
        setStoreNames(
          Array.isArray(result?.store_options) ? result.store_options : [],
        );
        setSummary(result?.summary || EMPTY_SUMMARY);
      } catch (loadError) {
        if (loadError?.name === "AbortError") return;
        console.error("Failed to load price history:", loadError);
        if (active) {
          setHistory([]);
          setSummary(EMPTY_SUMMARY);
          setError("Price history could not be loaded. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadHistory();
    return () => {
      active = false;
      controller.abort();
    };
  }, [productId, range, store, variantId]);

  return (
    <main className="smartphone-price-history-page min-h-[calc(100vh-4.5rem)] w-full bg-white px-3 py-6 sm:px-6 sm:py-10">
      <SEO
        title={`Price History | ${variantLabel}`}
        description={`View the price history for ${variantLabel}.`}
        url={location.pathname}
      />
      <div className="mx-auto max-w-5xl">
        <Link
          to={`${productPath}${variantId ? `?variantId=${encodeURIComponent(variantId)}` : ""}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
        >
          <span aria-hidden="true">‹</span>
          Back to product
        </Link>

        <section className="mt-5 bg-white p-4 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Price history
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {variantLabel}
            </h1>
          </div>

          {variants.length > 1 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Choose variant
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant, index) => {
                  const optionId =
                    variant?.variant_id ?? variant?.id ?? variant?.variantId;
                  const selected = String(optionId) === String(variantId);
                  return (
                    <button
                      key={optionId ?? index}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectVariant(variant, index)}
                      className={`min-h-10 rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        selected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
                      }`}
                    >
                      {variantLabelFor(variant, index)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {variantsLoading && (
            <p className="mt-3 text-xs text-slate-500">Loading variants…</p>
          )}
          {variantsError && (
            <p role="status" className="mt-3 text-xs text-amber-700">
              {variantsError}
            </p>
          )}

          {error && !loading ? (
            <p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : (
            <>
              <div className="mt-6 flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Source</p>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                    {storeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={store === option.value}
                        onClick={() => setStore(option.value)}
                        className={`min-h-8 rounded-md px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          store === option.value
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-600 hover:text-slate-950"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">Range</p>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                    {PRICE_HISTORY_RANGES.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        aria-pressed={range === option.key}
                        onClick={() => setRange(option.key)}
                        className={`min-h-8 min-w-9 rounded-md px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                          range === option.key
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-950"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 border-b border-slate-100 sm:grid-cols-4">
                {[
                  { label: "Current", value: summary.current_price },
                  { label: "Lowest", value: summary.lowest_price },
                  { label: "Highest", value: summary.highest_price },
                  { label: "Change", value: summary.change_percent, percent: true },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="border-l border-slate-100 py-4 pl-3 first:border-l-0 first:pl-0 sm:px-4 sm:first:pl-0"
                  >
                    <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
                      {metric.value == null || Number.isNaN(Number(metric.value))
                        ? "—"
                        : metric.percent
                          ? `${Number(metric.value).toFixed(1)}%`
                          : `₹ ${formatPrice(metric.value)}`}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                {loading ? (
                  <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                    Loading price history…
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                        <CartesianGrid stroke="#dfe7f3" strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          padding={{ left: 12, right: 12 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          width={76}
                          tickFormatter={(value) => `₹${formatPrice(value)}`}
                          domain={([min, max]) => [
                            min === max ? min * 0.9 : min * 0.97,
                            max === min ? max * 1.1 : max * 1.03,
                          ]}
                        />
                        <Tooltip
                          cursor={false}
                          formatter={(value) => [`₹ ${formatPrice(value)}`, "Price"]}
                          labelFormatter={(label) => `Date: ${label}`}
                          contentStyle={{
                            borderRadius: 12,
                            borderColor: "#dbeafe",
                            background: "rgba(255,255,255,0.96)",
                            boxShadow: "0 12px 24px rgba(15, 23, 42, 0.06)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 4.5, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 1.5 }}
                          activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2, fill: "#2563eb" }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                    No published price observations for this source and range.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default SmartphonePriceHistory;
