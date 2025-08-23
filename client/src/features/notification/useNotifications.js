import { useSelector, useDispatch } from "react-redux";
import { useCallback, useEffect } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadCount,
} from "./notificationsSlice";

export const useNotifications = () => {
  const dispatch = useDispatch();

  const notifications = useSelector(selectNotifications);
  const loading = useSelector(selectNotificationsLoading);
  const error = useSelector(selectNotificationsError);
  const unreadCount = useSelector(selectUnreadCount);

  // Memoize functions to prevent infinite loops
  const fetch = useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const markAsRead = useCallback(
    (notificationId) => dispatch(markNotificationRead(notificationId)),
    [dispatch]
  );

  const markAllAsRead = useCallback(
    () => dispatch(markAllNotificationsRead()),
    [dispatch]
  );

  const clearAll = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  // Auto-refresh notifications every 30 seconds when user is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (notifications.length > 0) {
        fetch();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetch, notifications.length]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetch,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
};
