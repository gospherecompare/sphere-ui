import { useEffect, useMemo, useState } from "react";
import { FaBell } from "react-icons/fa";
import {
  createPriceAlertSubscription,
  getCurrentCustomerPriceAlerts,
  unsubscribePriceAlert,
  updatePriceAlertSubscription,
} from "../../lib/priceAlerts";

const getVariantId = (variant) =>
  variant?.variant_id ?? variant?.id ?? variant?.variantId ?? null;

const getStoreName = (store) =>
  String(store?.store_name ?? store?.store ?? store?.storeName ?? "").trim();

const TrackPriceButton = ({
  productId,
  variant,
  variantLabel,
  stores = [],
}) => {
  const variantId = getVariantId(variant);
  const [storeKey, setStoreKey] = useState("mobilesx");
  const [triggerType, setTriggerType] = useState("any_drop");
  const [targetPrice, setTargetPrice] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const storeOptions = useMemo(() => {
    const unique = new Map();
    stores.forEach((store) => {
      const name = getStoreName(store);
      if (name && !unique.has(name.toLowerCase())) {
        unique.set(name.toLowerCase(), name);
      }
    });
    return [
      { value: "mobilesx", sourceType: "mobilesx", storeName: "", label: "MobilesX reference" },
      ...Array.from(unique.values(), (name) => ({
        value: `store:${name.toLowerCase()}`,
        sourceType: "store",
        storeName: name,
        label: name,
      })),
    ];
  }, [stores]);

  const selectedSource =
    storeOptions.find((option) => option.value === storeKey) || storeOptions[0];
  const activeSubscription = subscriptions.find(
    (subscription) =>
      subscription.is_active &&
      String(subscription.variant_id) === String(variantId) &&
      subscription.source_type === selectedSource.sourceType &&
      String(subscription.store_name || "").toLowerCase() ===
        selectedSource.storeName.toLowerCase(),
  );

  useEffect(() => {
    let active = true;
    if (!productId || !variantId) return undefined;
    getCurrentCustomerPriceAlerts()
      .then((items) => {
        if (active) setSubscriptions(items);
      })
      .catch((loadError) => {
        console.error("Failed to load price-alert subscriptions:", loadError);
      });
    return () => {
      active = false;
    };
  }, [productId, variantId]);

  useEffect(() => {
    if (!activeSubscription) {
      setTriggerType("any_drop");
      setTargetPrice("");
      return;
    }
    setTriggerType(activeSubscription.trigger_type);
    setTargetPrice(
      activeSubscription.target_price == null
        ? ""
        : String(activeSubscription.target_price),
    );
  }, [activeSubscription]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    const subscription = {
      product_id: Number(productId),
      variant_id: Number(variantId),
      source_type: selectedSource.sourceType,
      ...(selectedSource.storeName ? { store_name: selectedSource.storeName } : {}),
      trigger_type: triggerType,
      ...(triggerType === "target_price"
        ? { target_price: Number(targetPrice) }
        : {}),
    };

    try {
      let result;
      if (activeSubscription) {
        result = await updatePriceAlertSubscription(activeSubscription.id, {
          trigger_type: triggerType,
          ...(triggerType === "target_price"
            ? { target_price: Number(targetPrice) }
            : {}),
        });
        setSubscriptions((items) =>
          items.map((item) =>
            item.id === activeSubscription.id
              ? { ...item, ...result.subscription }
              : item,
          ),
        );
      } else {
        result = await createPriceAlertSubscription(subscription);
        const created = result.subscription;
        if (created) {
          setSubscriptions((items) => [
            ...items.filter((item) => item.id !== created.id),
            {
              ...subscription,
              ...created,
              store_name: selectedSource.storeName || null,
            },
          ]);
        }
      }
      setNotice(
        result.pushWarning
          ? `Price tracking is active. ${result.pushWarning}`
          : "Price tracking is active for this variant.",
      );
    } catch (saveError) {
      console.error("Failed to save price alert:", saveError);
      setError(saveError?.message || "Price tracking could not be saved.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!activeSubscription) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      await unsubscribePriceAlert(activeSubscription.id);
      setSubscriptions((items) =>
        items.map((item) =>
          item.id === activeSubscription.id
            ? { ...item, is_active: false }
            : item,
        ),
      );
      setNotice("Price tracking has been stopped.");
    } catch (unsubscribeError) {
      console.error("Failed to unsubscribe from price alert:", unsubscribeError);
      setError(unsubscribeError?.message || "Price tracking could not be stopped.");
    } finally {
      setLoading(false);
    }
  };

  if (!productId || !variantId) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError("");
          setNotice("");
        }}
        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 transition hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <FaBell aria-hidden="true" className="text-xs" />
        {activeSubscription ? "Price tracking active" : "Track price"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-price-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  {variantLabel || "Selected variant"}
                </p>
                <h2 id="track-price-title" className="mt-1 text-xl font-bold text-slate-950">
                  Track this price
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close price tracking"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-slate-700">
                Price source
                <select
                  value={storeKey}
                  onChange={(event) => setStoreKey(event.target.value)}
                  className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {storeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset>
                <legend className="text-sm font-semibold text-slate-700">
                  Notify me when
                </legend>
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="price-alert-trigger"
                    value="any_drop"
                    checked={triggerType === "any_drop"}
                    onChange={() => setTriggerType("any_drop")}
                  />
                  Any price drop
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="price-alert-trigger"
                    value="target_price"
                    checked={triggerType === "target_price"}
                    onChange={() => setTriggerType("target_price")}
                  />
                  Price reaches
                </label>
                {triggerType === "target_price" && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-slate-500">₹</span>
                    <input
                      type="number"
                      min="1"
                      max="100000000"
                      step="1"
                      required
                      value={targetPrice}
                      onChange={(event) => setTargetPrice(event.target.value)}
                      aria-label="Target price in rupees"
                      placeholder="Enter target price"
                      className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
                    />
                  </div>
                )}
              </fieldset>

              <p className="text-xs leading-5 text-slate-500">
                We’ll create an anonymous Firebase account to save this alert.
                Push permission is requested only after you start tracking.
              </p>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                  {notice}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-between">
                {activeSubscription ? (
                  <button
                    type="button"
                    onClick={handleUnsubscribe}
                    disabled={loading}
                    className="min-h-11 rounded-lg px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Stop tracking
                  </button>
                ) : <span />}
                <button
                  type="submit"
                  disabled={loading || (triggerType === "target_price" && !targetPrice)}
                  className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Saving…"
                    : activeSubscription
                      ? "Update alert"
                      : "Start tracking"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
};

export default TrackPriceButton;
