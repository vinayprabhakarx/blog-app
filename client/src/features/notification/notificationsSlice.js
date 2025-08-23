import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import notificationService from "./notificationsService";

// Async thunks
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.getNotifications();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notifications"
      );
    }
  }
);

export const fetchNotificationsByType = createAsyncThunk(
  "notifications/fetchNotificationsByType",
  async ({ type, params = {} }, { rejectWithValue }) => {
    try {
      const data = await notificationService.getNotificationsByType(
        type,
        params
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch notifications by type"
      );
    }
  }
);

export const getNotificationSummary = createAsyncThunk(
  "notifications/getNotificationSummary",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.getNotificationSummary();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get notification summary"
      );
    }
  }
);

export const getUnreadCount = createAsyncThunk(
  "notifications/getUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.getUnreadCount();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get unread count"
      );
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markNotificationRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const data = await notificationService.markNotificationRead(
        notificationId
      );
      return { notificationId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notification as read"
      );
    }
  }
);

export const markNotificationUnread = createAsyncThunk(
  "notifications/markNotificationUnread",
  async (notificationId, { rejectWithValue }) => {
    try {
      const data = await notificationService.markNotificationUnread(
        notificationId
      );
      return { notificationId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notification as unread"
      );
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllNotificationsRead",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.markAllNotificationsRead();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to mark all notifications as read"
      );
    }
  }
);

export const markNotificationsByTypeRead = createAsyncThunk(
  "notifications/markNotificationsByTypeRead",
  async (type, { rejectWithValue }) => {
    try {
      const data = await notificationService.markNotificationsByTypeRead(type);
      return { type, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to mark notifications by type as read"
      );
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/deleteNotification",
  async (notificationId, { rejectWithValue }) => {
    try {
      const data = await notificationService.deleteNotification(notificationId);
      return { notificationId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete notification"
      );
    }
  }
);

export const deleteNotificationsByType = createAsyncThunk(
  "notifications/deleteNotificationsByType",
  async (type, { rejectWithValue }) => {
    try {
      const data = await notificationService.deleteNotificationsByType(type);
      return { type, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to delete notifications by type"
      );
    }
  }
);

export const deleteReadNotifications = createAsyncThunk(
  "notifications/deleteReadNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.deleteReadNotifications();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete read notifications"
      );
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  "notifications/clearAllNotifications",
  async (_, { rejectWithValue }) => {
    try {
      const data = await notificationService.clearAllNotifications();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to clear all notifications"
      );
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  "notifications/updateNotificationPreferences",
  async (preferences, { rejectWithValue }) => {
    try {
      const data = await notificationService.updateNotificationPreferences(
        preferences
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to update notification preferences"
      );
    }
  }
);

export const markNotificationsAsSeen = createAsyncThunk(
  "notifications/markNotificationsAsSeen",
  async (notificationIds, { rejectWithValue }) => {
    try {
      const data = await notificationService.markNotificationsAsSeen(
        notificationIds
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to mark notifications as seen"
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    notifications: [],
    loading: false,
    error: null,
    unreadCount: 0,
    summary: null,
    summaryLoading: false,
    summaryError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.summaryError = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.is_read) {
        state.unreadCount += 1;
      }
    },
    updateNotification: (state, action) => {
      const { notificationId, updates } = action.payload;
      const index = state.notifications.findIndex(
        (n) => n._id === notificationId
      );
      if (index !== -1) {
        state.notifications[index] = {
          ...state.notifications[index],
          ...updates,
        };
      }
    },
    // Manual refresh trigger
    triggerRefresh: () => {
      // This action just triggers a refresh, no state changes needed
      // The actual refresh will be handled by the async thunk
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || action.payload;
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
        state.error = null;
      });

    // Fetch notifications by type
    builder
      .addCase(fetchNotificationsByType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsByType.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || action.payload;
        state.unreadCount = action.payload.unreadCount || 0;
      })
      .addCase(fetchNotificationsByType.rejected, (state) => {
        state.loading = false;
        state.error = null;
      });

    // Get notification summary
    builder
      .addCase(getNotificationSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(getNotificationSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload.summary;
      })
      .addCase(getNotificationSummary.rejected, (state) => {
        state.summaryLoading = false;
        state.summaryError = null;
      });

    // Get unread count
    builder.addCase(getUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload.unreadCount;
    });

    // Mark notification as read
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const { notificationId } = action.payload;
      const notification = state.notifications.find(
        (n) => n._id === notificationId
      );
      if (notification && !notification.is_read) {
        notification.is_read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    });

    // Mark notification as unread
    builder.addCase(markNotificationUnread.fulfilled, (state, action) => {
      const { notificationId } = action.payload;
      const notification = state.notifications.find(
        (n) => n._id === notificationId
      );
      if (notification && notification.is_read) {
        notification.is_read = false;
        state.unreadCount += 1;
      }
    });

    // Mark all notifications as read
    builder.addCase(markAllNotificationsRead.fulfilled, (state) => {
      state.notifications = state.notifications.map((notification) => ({
        ...notification,
        is_read: true,
      }));
      state.unreadCount = 0;
    });

    // Mark notifications by type as read
    builder.addCase(markNotificationsByTypeRead.fulfilled, (state, action) => {
      const { type } = action.payload;
      state.notifications = state.notifications.map((notification) => {
        if (notification.type === type && !notification.is_read) {
          return { ...notification, is_read: true };
        }
        return notification;
      });
      // Recalculate unread count
      state.unreadCount = state.notifications.filter((n) => !n.is_read).length;
    });

    // Delete notification
    builder.addCase(deleteNotification.fulfilled, (state, action) => {
      const { notificationId } = action.payload;
      const notification = state.notifications.find(
        (n) => n._id === notificationId
      );
      if (notification && !notification.is_read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(
        (n) => n._id !== notificationId
      );
    });

    // Delete notifications by type
    builder.addCase(deleteNotificationsByType.fulfilled, (state, action) => {
      const { type } = action.payload;
      const deletedNotifications = state.notifications.filter(
        (n) => n.type === type
      );
      const deletedUnreadCount = deletedNotifications.filter(
        (n) => !n.is_read
      ).length;
      state.unreadCount = Math.max(0, state.unreadCount - deletedUnreadCount);
      state.notifications = state.notifications.filter((n) => n.type !== type);
    });

    // Delete read notifications
    builder.addCase(deleteReadNotifications.fulfilled, (state) => {
      state.notifications = state.notifications.filter((n) => !n.is_read);
    });

    // Clear all notifications
    builder.addCase(clearAllNotifications.fulfilled, (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    });

    // Update notification preferences
    builder.addCase(updateNotificationPreferences.fulfilled, () => {
      // Preferences updated successfully, no state changes needed
    });

    // Mark notifications as seen
    builder.addCase(markNotificationsAsSeen.fulfilled, () => {
      // Notifications marked as seen, no state changes needed
    });
  },
});

export const {
  clearError,
  addNotification,
  updateNotification,
  triggerRefresh,
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications.notifications;
export const selectNotificationsLoading = (state) =>
  state.notifications.loading;
export const selectNotificationsError = (state) => state.notifications.error;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationSummary = (state) => state.notifications.summary;
export const selectNotificationSummaryLoading = (state) =>
  state.notifications.summaryLoading;
export const selectNotificationSummaryError = (state) =>
  state.notifications.summaryError;

export default notificationsSlice.reducer;
