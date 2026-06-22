import { useSelector, useDispatch } from "react-redux";
import { useCallback } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  clearAllNotifications,
  triggerRefresh,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadCount,
} from "@/features/notification/notificationsSlice";

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

  // Manual refresh function that can be called after actions
  const refreshNotifications = useCallback(() => {
    dispatch(triggerRefresh());
    fetch(); // Immediately fetch new notifications
  }, [dispatch, fetch]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetch,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshNotifications,
  };
};
