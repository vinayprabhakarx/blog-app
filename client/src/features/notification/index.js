// Export all notification-related components and hooks
export { default as NotificationDropdown } from "./NotificationDropdown";
export { default as NotificationDashboard } from "./NotificationDashboard";

export { default as notificationService } from "./notificationsService";
export { default as useNotifications } from "./useNotifications";

// Export Redux actions and selectors
export {
  fetchNotifications,
  fetchNotificationsByType,
  getNotificationSummary,
  getUnreadCount,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  markNotificationsByTypeRead,
  clearAllNotifications,
  deleteNotification,
  deleteNotificationsByType,
  deleteReadNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
  markNotificationsAsSeen,
  selectNotifications,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadCount,
  selectNotificationSummary,
  selectNotificationSummaryLoading,
  selectNotificationSummaryError,
} from "./notificationsSlice";
