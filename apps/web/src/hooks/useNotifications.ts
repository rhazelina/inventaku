// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  [key: string]: any;
}

export function useNotifications() {
  const { user, isAuthed } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length, 
  [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthed || !user) return;
    
    setLoading(true);
    try {
      // Mock data for now, replace with real API call
      const mock: Notification[] = [
        {
          id: '1',
          title: 'Stok Barang Menipis',
          message: 'Laptop ASUS Tuf Gaming F15 tinggal 2 unit.',
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Peminjaman Baru',
          message: 'Budi (XI PPLG 1) mengajukan peminjaman Kamera DSLR.',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString()
        }
      ];
      setNotifications(mock);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthed, user]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (isAuthed) {
      fetchNotifications();
    }
  }, [isAuthed, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    clearAll
  };
}
