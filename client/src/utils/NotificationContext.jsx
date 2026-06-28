import React, { createContext, useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchNotifications,
  getNotificationSummary,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationSummary,
} from "@/features/notification/notificationsSlice";
import notificationService from "@/features/notification/notificationsService";

const NotificationContext = createContext();

export { NotificationContext };

export const NotificationProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useAuth();
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const summary = useSelector(selectNotificationSummary);

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchNotifications());
      dispatch(getNotificationSummary());
      dispatch(getUnreadCount());
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsPolling(false);
      return;
    }

    let isMounted = true;
    setIsPolling(true);

    const pollInterval = setInterval(async () => {
      if (!isMounted) return;

      try {
        const unreadResponse = await notificationService.getUnreadCount();
        const currentUnreadCount = unreadResponse.unreadCount;

        if (isMounted && currentUnreadCount !== unreadCount) {
          await Promise.allSettled([
            dispatch(fetchNotifications()),
            dispatch(getNotificationSummary()),
          ]);
        }

        if (isMounted) {
          setLastUpdate(new Date());
        }
      } catch (error) {
        if (isMounted) {
          if (error.response && error.response.status === 401) {
            // Stop polling if unauthorized (token expired, etc.)
            setIsPolling(false);
            clearInterval(pollInterval);
          } else {
            console.error("Error polling notifications:", error);
          }
        }
      }
    }, 30000); // Increased to 30 seconds to reduce API calls

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isAuthenticated, user, dispatch, unreadCount]);

  const markAsRead = useCallback(
    async (notificationId) => {
      try {
        await dispatch(markNotificationRead(notificationId)).unwrap();
        dispatch(getUnreadCount());
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [dispatch]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await dispatch(markAllNotificationsRead()).unwrap();
      dispatch(fetchNotifications());
      dispatch(getNotificationSummary());
      dispatch(getUnreadCount());
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [dispatch]);

  const refreshNotifications = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        dispatch(fetchNotifications()),
        dispatch(getNotificationSummary()),
        dispatch(getUnreadCount()),
      ]);

      const hasSuccess = results.some(
        (result) => result.status === "fulfilled"
      );
      if (hasSuccess) {
        setLastUpdate(new Date());
        return;
      }

      try {
        const [notificationsRes, summaryRes, unreadRes] = await Promise.all([
          notificationService.getNotifications(),
          notificationService.getNotificationSummary(),
          notificationService.getUnreadCount(),
        ]);

        if (notificationsRes.success) {
          dispatch(fetchNotifications.fulfilled(notificationsRes, ""));
        }
        if (summaryRes.success) {
          dispatch(getNotificationSummary.fulfilled(summaryRes, ""));
        }
        if (unreadRes.success) {
          dispatch(getUnreadCount.fulfilled(unreadRes, ""));
        }

        setLastUpdate(new Date());
      } catch {
        throw new Error("All notification refresh operations failed");
      }
    } catch (error) {
      console.error("Error in refreshNotifications:", error);
      throw error;
    }
  }, [dispatch]);

  const getNotificationsByType = useCallback(async (type, params = {}) => {
    try {
      const response = await notificationService.getNotificationsByType(
        type,
        params
      );
      return response;
    } catch (error) {
      console.error(`Error fetching ${type} notifications:`, error);
      throw error;
    }
  }, []);

  const updatePreferences = useCallback(async (preferences) => {
    try {
      const response = await notificationService.updateNotificationPreferences(
        preferences
      );
      return response;
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    summary,
    isPolling,
    lastUpdate,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationsByType,
    updatePreferences,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
