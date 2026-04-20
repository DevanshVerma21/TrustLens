import { useState, useEffect } from 'react';
import { alertsAPI } from '../utils/api';

/**
 * Custom hook for alerts data
 */
export const useAlerts = (page = 1, limit = 20) => {
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchAlerts();
    fetchUnreadCount();
  }, [page, limit]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await alertsAPI.getAlerts({ page, limit });
      const payload = data?.data || data;
      setAlerts(payload?.alerts || []);
      setPagination(payload?.pagination || { page, limit, total: 0, pages: 0 });
    } catch (err) {
      setError(err.message || 'Failed to fetch alerts');
      console.error('Alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await alertsAPI.getUnreadCount();
      const payload = data?.data || data;
      setUnreadCount(payload?.unreadCount || 0);
    } catch (err) {
      console.error('Unread count fetch error:', err);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await alertsAPI.markAsRead(alertId);
      setAlerts(alerts.map((a) => (a._id === alertId ? { ...a, isRead: true } : a)));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await alertsAPI.markAllAsRead();
      setAlerts(alerts.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await alertsAPI.deleteAlert(alertId);
      setAlerts(alerts.filter((a) => a._id !== alertId));
    } catch (err) {
      console.error('Delete alert error:', err);
    }
  };

  const clearRead = async () => {
    try {
      await alertsAPI.clearRead();
      setAlerts(alerts.filter((a) => !a.isRead));
    } catch (err) {
      console.error('Clear read error:', err);
    }
  };

  return {
    alerts,
    unreadCount,
    loading,
    error,
    pagination,
    refetch: fetchAlerts,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    clearRead,
  };
};

export default useAlerts;
