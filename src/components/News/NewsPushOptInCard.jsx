import React, { useEffect, useState } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa";
import {
  getNewsPushStatus,
  registerForNewsPush,
  unregisterFromNewsPush,
} from "../../lib/newsPushNotifications";

const NewsPushOptInCard = () => {
  const [status, setStatus] = useState({
    supported: true,
    reason: "",
    permission: "default",
    enabled: false,
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;

    const syncStatus = async () => {
      const nextStatus = await getNewsPushStatus();
      if (!active) return;
      setStatus(nextStatus);
    };

    void syncStatus();

    return () => {
      active = false;
    };
  }, []);

  const refreshStatus = async () => {
    const nextStatus = await getNewsPushStatus();
    setStatus(nextStatus);
  };

  const handleEnable = async () => {
    setBusy(true);
    setFeedback("");

    try {
      await registerForNewsPush();
      await refreshStatus();
      setFeedback("News alerts are enabled on this browser.");
    } catch (err) {
      setFeedback(err?.message || "Unable to enable news alerts right now.");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setFeedback("");

    try {
      await unregisterFromNewsPush();
      await refreshStatus();
      setFeedback("News alerts are turned off for this browser.");
    } catch (err) {
      setFeedback(err?.message || "Unable to turn off alerts right now.");
    } finally {
      setBusy(false);
    }
  };

  const isBlocked = status.permission === "denied";
  const actionLabel = status.enabled ? "Disable Alerts" : "Enable News Alerts";
  const description = status.enabled
    ? "You’ll get launch alerts and important newsroom updates on this browser."
    : "Turn on browser alerts for launch news, major stories, and quick Hooks updates.";

  return (
    <section className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br from-slate-950 via-[#173570] to-blue-700 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
        <div className="grid gap-5 px-5 py-6 sm:px-7 sm:py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
              Hooks Alerts
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
              Stay on top of mobile launches without camping in the refresh button.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 sm:text-[15px]">
              {description}
            </p>
            {!status.supported && (
              <p className="mt-3 text-sm font-medium text-amber-200">
                {status.reason}
              </p>
            )}
            {isBlocked && (
              <p className="mt-3 text-sm font-medium text-amber-200">
                Notifications are blocked in this browser. Re-enable them from the
                browser site settings to subscribe again.
              </p>
            )}
            {feedback && (
              <p className="mt-3 text-sm font-medium text-white/85">{feedback}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm">
              {status.enabled ? <FaBell /> : <FaBellSlash />}
              {status.enabled ? "Alerts On" : "Alerts Off"}
            </span>
            <button
              type="button"
              onClick={status.enabled ? handleDisable : handleEnable}
              disabled={busy || !status.supported || isBlocked}
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#173570] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-slate-500"
            >
              {busy ? "Working..." : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsPushOptInCard;
