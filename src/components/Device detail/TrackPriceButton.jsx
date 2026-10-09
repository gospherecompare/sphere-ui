import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [triggerType, setTriggerType] = useState("any_drop");
  const [targetPrice, setTargetPrice] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sourceMenuRef = useRef(null);

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

  useEffect(() => {
    if (!sourceMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!sourceMenuRef.current?.contains(event.target)) {
        setSourceMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setSourceMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sourceMenuOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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

      {open &&
        typeof document !== "undefined" &&
        createPortal(
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loading) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="track-price-title"
            className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-none bg-white p-5 shadow-[0_24px_80px_rgba(2,6,23,0.32)] sm:p-6"
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
              <div className="relative z-20" ref={sourceMenuRef}>
                <span
                  id="track-price-source-label"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Price source
                </span>
                <button
                  type="button"
                  aria-labelledby="track-price-source-label track-price-source-value"
                  aria-haspopup="listbox"
                  aria-expanded={sourceMenuOpen}
                  onClick={() => setSourceMenuOpen((isOpen) => !isOpen)}
                  className="mt-1.5 flex min-h-11 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-left text-sm font-normal text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <span id="track-price-source-value" className="truncate">
                    {selectedSource.label}
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`ml-3 h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                      sourceMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                {sourceMenuOpen ? (
                  <div
                    role="listbox"
                    aria-labelledby="track-price-source-label"
                    className="absolute left-0 right-0 top-full z-30 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                  >
                    {storeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={option.value === storeKey}
                        onClick={() => {
                          setStoreKey(option.value);
                          setSourceMenuOpen(false);
                        }}
                        className={`block min-h-10 w-full px-3 py-2 text-left text-sm transition ${
                          option.value === storeKey
                            ? "bg-blue-50 font-semibold text-blue-800"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

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
                    className="h-4 w-4 appearance-none rounded-full border border-slate-300 bg-white checked:border-[5px] checked:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
                    className="h-4 w-4 appearance-none rounded-full border border-slate-300 bg-white checked:border-[5px] checked:border-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
                  className="min-h-11 rounded-lg border border-blue-600 bg-white px-4 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>,
        document.body,
      )}
    </>
  );
};

export default TrackPriceButton;
