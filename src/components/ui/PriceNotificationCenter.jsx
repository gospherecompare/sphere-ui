import { useEffect, useState } from "react";
import { onMessage } from "firebase/messaging";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getFirebaseMessagingClient } from "../../lib/firebase";
import {
  getCustomerNotifications,
  markAllCustomerNotificationsRead,
  markCustomerNotificationRead,
} from "../../lib/priceAlerts";

const getNotificationMessage = (item) => {
  const payload = item?.payload && typeof item.payload === "object" ? item.payload : {};
  return {
    title: String(payload.title || "Price update"),
    message: String(payload.message || "A tracked price has changed."),
    url: String(payload.url || ""),
  };
};

const PriceNotificationCenter = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [foregroundNotice, setForegroundNotice] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getCustomerNotifications();
      setNotifications(Array.isArray(result?.notifications) ? result.notifications : []);
      setUnreadCount(Number(result?.unread_count) || 0);
    } catch (loadError) {
      console.error("Failed to load price notifications:", loadError);
      setError(loadError?.message || "Notifications could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    getFirebaseMessagingClient()
      .then((messaging) => {
        if (!active || !messaging) return;
        unsubscribe = onMessage(messaging, (payload) => {
          const nextNotice = {
            title: String(payload?.notification?.title || payload?.data?.title || "Price update"),
            message: String(payload?.notification?.body || payload?.data?.message || "A tracked price has changed."),
            url: String(payload?.data?.url || ""),
          };
          setForegroundNotice(nextNotice);
          setUnreadCount((count) => count + 1);
          if (open) void refresh();
        });
      })
      .catch((messagingError) => {
        console.error("Could not initialize foreground push notifications:", messagingError);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [open]);

  const openCenter = async () => {
    setOpen((current) => !current);
    setForegroundNotice(null);
    if (!open) await refresh();
  };

  const openNotification = async (item) => {
    try {
      await markCustomerNotificationRead(item.id);
      setNotifications((items) =>
        items.map((candidate) =>
          candidate.id === item.id
            ? { ...candidate, read_at: candidate.read_at || new Date().toISOString() }
            : candidate,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - (item.read_at ? 0 : 1)));
    } catch (readError) {
      console.error("Failed to mark notification as read:", readError);
      setError(readError?.message || "Notification could not be marked as read.");
    }
    const { url } = getNotificationMessage(item);
    if (url.startsWith("/") && !url.startsWith("//")) {
      setOpen(false);
      navigate(url);
    }
  };

  const markAllRead = async () => {
    setError("");
    try {
      await markAllCustomerNotificationsRead();
      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          read_at: item.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (readError) {
      console.error("Failed to mark all notifications as read:", readError);
      setError(readError?.message || "Notifications could not be marked as read.");
    }
  };

  return (
    <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-[90] lg:bottom-6">
      {foregroundNotice && (
        <button
          type="button"
          onClick={() => {
            if (foregroundNotice.url.startsWith("/")) navigate(foregroundNotice.url);
            setForegroundNotice(null);
            setOpen(true);
            void refresh();
          }}
          className="mb-3 block w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-blue-100 bg-white p-4 text-left shadow-xl"
        >
          <span className="block text-sm font-bold text-slate-900">
            {foregroundNotice.title}
          </span>
          <span className="mt-1 block text-xs leading-5 text-slate-600">
            {foregroundNotice.message}
          </span>
        </button>
      )}

      {open && (
        <section
          aria-label="Notifications"
          className="mb-3 max-h-[min(70vh,34rem)] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="font-bold text-slate-900">Notifications</h2>
              <p className="text-xs text-slate-500">
                {unreadCount ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <div className="max-h-[calc(min(70vh,34rem)-4.5rem)] overflow-y-auto">
            {loading ? (
              <p className="p-5 text-sm text-slate-500">Loading notifications…</p>
            ) : notifications.length ? (
              notifications.map((item) => {
                const message = getNotificationMessage(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void openNotification(item)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${
                      item.read_at ? "bg-white" : "bg-blue-50/60"
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      {!item.read_at && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {message.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                          {message.message}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="p-5 text-sm text-slate-500">
                No price notifications yet. Track a product to get started.
              </p>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        aria-label={`Open notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={() => void openCenter()}
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <FaBell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default PriceNotificationCenter;
