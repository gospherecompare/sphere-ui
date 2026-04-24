import React, { useEffect, useState } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import {
  getNewsPushStatus,
  registerForNewsPush,
} from "../../lib/newsPushNotifications";

const OVERLAY_DISMISS_KEY = "hooks.news_push.overlay.dismissed_at";
const OVERLAY_DISMISS_WINDOW_MS = 6 * 60 * 60 * 1000;
const OVERLAY_DELAY_MS = 1200;

const readOverlayDismissedAt = () => {
  if (typeof window === "undefined") return 0;
  const raw = Number(window.localStorage.getItem(OVERLAY_DISMISS_KEY) || 0);
  return Number.isFinite(raw) ? raw : 0;
};

const writeOverlayDismissedAt = (value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OVERLAY_DISMISS_KEY, String(value));
};

const shouldOpenOverlay = (nextStatus) => {
  if (!nextStatus?.supported) return false;
  if (nextStatus?.enabled) return false;
  if (nextStatus?.permission === "denied") return false;

  const dismissedAt = readOverlayDismissedAt();
  return Date.now() - dismissedAt > OVERLAY_DISMISS_WINDOW_MS;
};

const NewsPushOptInCard = () => {
  const [status, setStatus] = useState({
    supported: true,
    reason: "",
    permission: "default",
    enabled: false,
  });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let timerId = 0;

    const syncStatus = async () => {
      const nextStatus = await getNewsPushStatus();
      if (!active) return;

      setStatus(nextStatus);

      if (shouldOpenOverlay(nextStatus)) {
        timerId = window.setTimeout(() => {
          if (!active) return;
          setOpen(true);
        }, OVERLAY_DELAY_MS);
      }
    };

    void syncStatus();

    return () => {
      active = false;
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  const refreshStatus = async () => {
    const nextStatus = await getNewsPushStatus();
    setStatus(nextStatus);
    return nextStatus;
  };

  const handleClose = () => {
    writeOverlayDismissedAt(Date.now());
    setOpen(false);
    setFeedback("");
  };

  const handleEnable = async () => {
    setBusy(true);
    setFeedback("");

    try {
      await registerForNewsPush();
      const nextStatus = await refreshStatus();
      if (nextStatus.enabled) {
        setOpen(false);
      }
    } catch (err) {
      setFeedback(err?.message || "Unable to enable news alerts right now.");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  if (!open || status.enabled || !status.supported || status.permission === "denied") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6 sm:px-6">
      <button
        type="button"
        aria-label="Close notification prompt"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[3px]"
        onClick={busy ? undefined : handleClose}
      />

      <div className="relative z-[81] w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.26)]">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <FaBell />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Hooks News
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Turn on notifications
              </h2>
            </div>
          </div>

          <button
            type="button"
            aria-label="Dismiss notification prompt"
            onClick={busy ? undefined : handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6">
          <p className="text-sm leading-6 text-slate-600">
            Get a browser alert when major launch stories, breaking updates, and
            important Hooks news go live.
          </p>

          {feedback && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {feedback}
            </div>
          )}

          <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Maybe later
            </button>
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {busy ? "Working..." : "Enable notifications"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsPushOptInCard;
