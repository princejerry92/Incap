import { useState, useEffect, useCallback } from 'react';
import { notificationsAPI } from '../services/api';

/**
 * Custom hook for managing notifications with API integration.
 * Handles real-time updates, notification storage, and cleanup.
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationsAPI.getNotifications(50);
      
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount((response.data || []).filter(n => !n.read).length);
      } else {
        setError(response.error || 'Failed to load notifications');
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      setError(err.message || 'Error loading notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add new notification(s) to state (for backward compatibility)
  const addNotifications = useCallback((newNotifications) => {
    if (!Array.isArray(newNotifications)) {
      newNotifications = [newNotifications];
    }

    setNotifications(prev => {
      const filtered = newNotifications.filter(newNotif =>
        !prev.some(existing => existing.id === newNotif.id)
      );

      if (filtered.length === 0) return prev;

      const updated = [...filtered, ...prev];
      setUnreadCount(updated.filter(n => !n.read).length);

      return updated;
    });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      
      if (response.success) {
        setNotifications(prev => {
          const updated = prev.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          );
          setUnreadCount(updated.filter(n => !n.read).length);
          return updated;
        });
      } else {
        console.error('Failed to mark notification as read:', response.error);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      
      if (response.success) {
        setNotifications(prev => {
          const updated = prev.map(notif => ({ ...notif, read: true }));
          setUnreadCount(0);
          return updated;
        });
      } else {
        console.error('Failed to mark all notifications as read:', response.error);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await notificationsAPI.deleteNotification(notificationId);
      
      if (response.success) {
        setNotifications(prev => {
          const updated = prev.filter(notif => notif.id !== notificationId);
          setUnreadCount(updated.filter(n => !n.read).length);
          return updated;
        });
      } else {
        console.error('Failed to delete notification:', response.error);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await notificationsAPI.clearAllNotifications();
      
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error('Failed to clear notifications:', response.error);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    addNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refresh: loadNotifications
  };
};