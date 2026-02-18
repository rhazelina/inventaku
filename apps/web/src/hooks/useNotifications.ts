// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../auth/useAuth";
import { apiNotifications } from "../lib/api";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  action_url?: string | null;
  read_at?: string | null;
  created_at: string;
}

export function useNotifications() {
  const { user, isAuthed } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read_at).length,
    [notifications]
  );

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!isAuthed || !user) return;

    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res: any = await apiNotifications.list({ limit: 50 });
      setNotifications(Array.isArray(res?.data) ? res.data : []);
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      setError(err?.message || "Gagal memuat notifikasi");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [isAuthed, user]);

  const markAsRead = useCallback(async (id: string) => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || now } : n))
    );
    try {
      await apiNotifications.markAsRead(id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
    try {
      await apiNotifications.markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const deleteNotification = useCallback(async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiNotifications.delete(id);
    } catch (err) {
      console.error("Failed to delete notification:", err);
      setNotifications(previous);
    }
  }, [notifications]);

  const deleteAllNotifications = useCallback(async () => {
    const previous = notifications;
    setNotifications([]);
    try {
      await apiNotifications.deleteAll();
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
      setNotifications(previous);
    }
  }, [notifications]);

  useEffect(() => {
    if (!isAuthed) {
      setNotifications([]);
      setError(null);
      return;
    }
    if (isAuthed) {
      fetchNotifications();
    }
  }, [isAuthed, fetchNotifications]);

  useEffect(() => {
    if (!isAuthed) return;
    const interval = window.setInterval(() => {
      fetchNotifications(true);
    }, 30000);

    const onFocus = () => fetchNotifications(true);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthed, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}
