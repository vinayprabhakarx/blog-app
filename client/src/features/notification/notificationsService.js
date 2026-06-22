import api from "@/api/api.js";

const notificationService = {
  // Get all notifications for current user
  getNotifications: async (params = {}) => {
    const { page = 1, limit = 20 } = params;
    const response = await api.get(
      `/notifications?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get notifications by type
  getNotificationsByType: async (type, params = {}) => {
    const { page = 1, limit = 20 } = params;
    const response = await api.get(
      `/notifications/by-type/${type}?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get notification summary
  getNotificationSummary: async () => {
    const response = await api.get("/notifications/summary");
    return response.data;
  },

  // Mark a notification as read
  markNotificationRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark a notification as unread
  markNotificationUnread: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/unread`);
    return response.data;
  },

  // Mark all notifications as read
  markAllNotificationsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },

  // Mark notifications by type as read
  markNotificationsByTypeRead: async (type) => {
    const response = await api.put(`/notifications/read-by-type/${type}`);
    return response.data;
  },

  // Clear all notifications
  clearAllNotifications: async () => {
    const response = await api.delete("/notifications");
    return response.data;
  },

  // Delete a specific notification
  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Delete notifications by type
  deleteNotificationsByType: async (type) => {
    const response = await api.delete(`/notifications/by-type/${type}`);
    return response.data;
  },

  // Delete read notifications
  deleteReadNotifications: async () => {
    const response = await api.delete("/notifications/read");
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  // Get notification preferences
  getNotificationPreferences: async () => {
    const response = await api.get("/notifications/preferences");
    return response.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    const response = await api.put("/notifications/preferences", { preferences });
    return response.data;
  },

  // Mark notifications as seen
  markNotificationsAsSeen: async (notificationIds = null) => {
    const response = await api.post("/notifications/mark-seen", { notificationIds });
    return response.data;
  },
};

export default notificationService;
