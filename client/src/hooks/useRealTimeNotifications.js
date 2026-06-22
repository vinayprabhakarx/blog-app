import { useEffect, useRef, useCallback } from "react";
import { useNotificationContext } from "./useNotificationContext";
import { useAuth } from "./useAuth";
import { showToast } from "@/helpers/showToast";

export const useRealTimeNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const { unreadCount, refreshNotifications, isPolling, lastUpdate } =
    useNotificationContext();

  const previousUnreadCount = useRef(0);
  const notificationSound = useRef(null);

  // Initialize notification sound
  useEffect(() => {
    if (typeof window !== "undefined") {
      notificationSound.current = new Audio("/notification-sound.mp3");
      notificationSound.current.volume = 0.3;
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (notificationSound.current) {
      notificationSound.current.play().catch((error) => {
        console.log("Could not play notification sound:", error);
      });
    }
  }, []);

  // Show desktop notification
  const showDesktopNotification = useCallback((title, options = {}) => {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(title, {
        icon: "/logo-light.png",
        badge: "/logo-light.png",
        ...options,
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, {
            icon: "/logo-light.png",
            badge: "/logo-light.png",
            ...options,
          });
        }
      });
    }
  }, []);

  // Handle new notifications
  const handleNewNotifications = useCallback(
    (newCount, oldCount) => {
      if (newCount > oldCount) {
        const newNotificationsCount = newCount - oldCount;

        // Play sound if enabled
        const preferences = JSON.parse(
          localStorage.getItem("notificationPreferences") || "{}"
        );
        if (preferences.playSound !== false) {
          playNotificationSound();
        }

        // Show desktop notification if enabled
        if (preferences.pushNotifications !== false) {
          showDesktopNotification(
            `You have ${newNotificationsCount} new notification${
              newNotificationsCount > 1 ? "s" : ""
            }`,
            {
              body: "Click to view your notifications",
              tag: "new-notifications",
              requireInteraction: false,
              silent: true,
            }
          );
        }

        // Show toast notification
        showToast(
          "info",
          `${newNotificationsCount} new notification${
            newNotificationsCount > 1 ? "s" : ""
          } received!`
        );
      }
    },
    [playNotificationSound, showDesktopNotification]
  );

  // Monitor unread count changes
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      previousUnreadCount.current !== unreadCount
    ) {
      handleNewNotifications(unreadCount, previousUnreadCount.current);
      previousUnreadCount.current = unreadCount;
    }
  }, [unreadCount, isAuthenticated, user, handleNewNotifications]);

  // Request notification permissions on mount
  useEffect(() => {
    if (
      isAuthenticated &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, [isAuthenticated]);

  // Auto-refresh when user becomes active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        refreshNotifications();
      }
    };

    const handleFocus = () => {
      if (isAuthenticated) {
        refreshNotifications();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, refreshNotifications]);

  return {
    unreadCount,
    isPolling,
    lastUpdate,
    refreshNotifications,
    showDesktopNotification,
    playNotificationSound,
  };
};
