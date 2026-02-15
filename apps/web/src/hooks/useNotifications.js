import { useEffect, useState, useCallback, useRef } from "react";
import { apiNotifications } from "../lib/api";

// Mock notifications for development/fallback
const createMockNotifications = () => [
  {
    id: 1,
    title: "Selamat Datang",
    message: "Notifikasi sistem sedang dalam pengembangan. Fitur lengkap akan segera tersedia.",
    type: "info",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    read_at: null,
    action_url: "/dashboard",
  },
  {
    id: 2,
    title: "Pembaruan Sistem",
    message: "Sistem notifikasi baru telah diaktifkan untuk memberikan informasi real-time.",
    type: "success",
    created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    read_at: null,
    action_url: null,
  },
];

// Storage key for local notifications
const NOTIFICATIONS_STORAGE_KEY = "app_notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);
  const [useMockData, setUseMockData] = useState(false);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiNotifications.list({ limit: 50, sort: "-created_at" });
      const data = Array.isArray(res) ? res : res?.data || [];
      setNotifications(data);
      setUseMockData(false);
      // Save to localStorage as backup
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Failed to load notifications from API:", e?.message);
      
      // Fallback to localStorage or mock data
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setNotifications(data);
          setUseMockData(false);
        } catch {
          // If localStorage is corrupted, use mock data
          const mockData = createMockNotifications();
          setNotifications(mockData);
          setUseMockData(true);
        }
      } else {
        // Use mock data if nothing is stored
        const mockData = createMockNotifications();
        setNotifications(mockData);
        setUseMockData(true);
      }
      
      // Only set error if it's not a 404 (which is expected during development)
      if (e?.status !== 404) {
        setError(e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      if (!useMockData) {
        await apiNotifications.markAsRead(notificationId);
      }
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        );
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn("Failed to mark notification as read:", e?.message);
      // Still update locally even if API fails
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        );
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [useMockData]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      if (!useMockData) {
        await apiNotifications.markAllAsRead();
      }
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, read_at: new Date().toISOString() }));
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn("Failed to mark all as read:", e?.message);
      // Still update locally even if API fails
      setNotifications((prev) => {
        const updated = prev.map((n) => ({ ...n, read_at: new Date().toISOString() }));
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [useMockData]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      if (!useMockData) {
        await apiNotifications.delete(notificationId);
      }
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.warn("Failed to delete notification:", e?.message);
      // Still update locally even if API fails
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== notificationId);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [useMockData]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      if (!useMockData) {
        await apiNotifications.deleteAll();
      }
      setNotifications([]);
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to delete all notifications:", e?.message);
      // Still update locally even if API fails
      setNotifications([]);
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    }
  }, [useMockData]);

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [loadNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };
}
