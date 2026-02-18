import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Info,
  CheckCheck,
} from "lucide-react";
import { PageShell, LoadingLine, ErrorBox, SecondaryButton } from "./_ui";
import { useNotifications } from "../hooks/useNotifications";

// ✅ Tailwind-safe: simpen class langsung, jangan dynamic bg-${color}
const notificationTypeConfig = {
  info: {
    icon: Info,
    label: "Info",
    cardBg: "bg-blue-50",
    cardBorder: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    iconWrap: "bg-blue-100",
    iconText: "text-blue-600",
  },
  warning: {
    icon: AlertCircle,
    label: "Peringatan",
    cardBg: "bg-yellow-50",
    cardBorder: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    iconWrap: "bg-yellow-100",
    iconText: "text-yellow-700",
  },
  success: {
    icon: CheckCircle2,
    label: "Sukses",
    cardBg: "bg-green-50",
    cardBorder: "border-green-200",
    badge: "bg-green-100 text-green-700",
    iconWrap: "bg-green-100",
    iconText: "text-green-700",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    cardBg: "bg-red-50",
    cardBorder: "border-red-200",
    badge: "bg-red-100 text-red-700",
    iconWrap: "bg-red-100",
    iconText: "text-red-700",
  },
};

const safeDate = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (dateString) => {
  const date = safeDate(dateString);
  if (!date) return "-";

  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "Baru saja";
  if (minutes < 60) return `${minutes}m yang lalu`;
  if (hours < 24) return `${hours}h yang lalu`;
  if (days < 7) return `${days}d yang lalu`;

  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const grouped = useMemo(() => {
    const groups = { unread: [], read: [] };
    for (const notif of notifications) {
      if (notif.read_at) groups.read.push(notif);
      else groups.unread.push(notif);
    }
    return groups;
  }, [notifications]);

  const handleNotificationClick = useCallback(
    (notification) => {
      if (!notification.read_at) markAsRead(notification.id);
      if (notification.action_url) navigate(notification.action_url);
    },
    [markAsRead, navigate]
  );

  const handleDeleteAll = useCallback(() => {
    const ok = window.confirm("Yakin ingin menghapus semua notifikasi?");
    if (!ok) return;
    deleteAllNotifications();
  }, [deleteAllNotifications]);

  return (
    <PageShell
      title="Notifikasi"
      subtitle="Kelola dan pantau semua notifikasi sistem Anda"
      right={
        notifications.length > 0 && (
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <SecondaryButton onClick={markAllAsRead}>
                Tandai Semua Dibaca
              </SecondaryButton>
            )}
            <SecondaryButton onClick={handleDeleteAll}>
              Hapus Semua
            </SecondaryButton>
          </div>
        )
      }
    >
      <ErrorBox error={error} />

      {loading ? (
        <LoadingLine text="Memuat notifikasi..." />
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-gray-100 mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak ada notifikasi
          </h3>
          <p className="text-gray-600 mb-6 max-w-sm">
            Anda tidak memiliki notifikasi saat ini.
          </p>
          <SecondaryButton onClick={() => navigate("/dashboard")}>
            Kembali ke Dashboard
          </SecondaryButton>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Unread */}
          {grouped.unread.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Circle className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Belum Dibaca ({unreadCount})
                </h3>
              </div>

              <div className="space-y-3">
                {grouped.unread.map((notif) => {
                  const cfg =
                    notificationTypeConfig[notif.type] ||
                    notificationTypeConfig.info;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      role="button"
                      tabIndex={0}
                      className={[
                        "group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                        cfg.cardBg,
                        cfg.cardBorder,
                        "hover:shadow-md hover:scale-[1.02]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={[
                            "p-3 rounded-lg flex-shrink-0",
                            cfg.iconWrap,
                            cfg.iconText,
                          ].join(" ")}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {notif.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            <span
                              className={[
                                "px-2 py-1 text-xs font-medium rounded-full flex-shrink-0",
                                cfg.badge,
                              ].join(" ")}
                              title={notif.type}
                            >
                              {cfg.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(notif.created_at)}
                            </span>
                          </div>
                        </div>

                        {/* Belum sebagai fungsi  */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Hapus notifikasi"
                          aria-label="Hapus notifikasi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Read */}
          {grouped.read.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCheck className="w-5 h-5 text-gray-400" />
                <h3 className="font-semibold text-gray-900">
                  Sudah Dibaca ({grouped.read.length})
                </h3>
              </div>

              <div className="space-y-2">
                {grouped.read.map((notif) => {
                  const cfg =
                    notificationTypeConfig[notif.type] ||
                    notificationTypeConfig.info;
                  const Icon = cfg.icon;

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className="group relative p-4 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-white hover:shadow-sm transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-gray-100 text-gray-500 flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-700 group-hover:text-gray-900">
                                {notif.title}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full flex-shrink-0">
                              {cfg.label}
                            </span>
                          </div>

                          <span className="text-xs text-gray-400 mt-2 block">
                            {formatDate(notif.created_at)}
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Hapus notifikasi"
                          aria-label="Hapus notifikasi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
